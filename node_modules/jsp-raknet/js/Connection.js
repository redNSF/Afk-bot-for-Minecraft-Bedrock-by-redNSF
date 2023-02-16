"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
const jsbinaryutils_1 = __importDefault(require("@jsprismarine/jsbinaryutils"));
const ACK_1 = __importDefault(require("./protocol/ACK"));
const bitflags_1 = __importDefault(require("./protocol/bitflags"));
const ConnectedPing_1 = __importDefault(require("./protocol/ConnectedPing"));
const ConnectedPong_1 = __importDefault(require("./protocol/ConnectedPong"));
const ConnectionRequest_1 = __importDefault(require("./protocol/ConnectionRequest"));
const ConnectionRequestAccepted_1 = __importDefault(require("./protocol/ConnectionRequestAccepted"));
const DataPacket_1 = require("./protocol/DataPacket");
const EncapsulatedPacket_1 = __importDefault(require("./protocol/EncapsulatedPacket"));
const Identifiers_1 = __importDefault(require("./protocol/Identifiers"));
const NACK_1 = __importDefault(require("./protocol/NACK"));
const NewIncomingConnection_1 = __importDefault(require("./protocol/NewIncomingConnection"));
const reliability_1 = __importDefault(require("./protocol/reliability"));
const Server_1 = require("./Server");
const { SlidingReceiveWindow, SlidingOrderedWindow } = require('./SlidingWindow');
const debug = require('debug')('raknet');
var Priority;
(function (Priority) {
    Priority[Priority["Normal"] = 0] = "Normal";
    Priority[Priority["Immediate"] = 1] = "Immediate";
})(Priority || (Priority = {}));
const CONNECTION_TIMEOUT = 10000;
class Connection {
    constructor(listener, mtuSize, address) {
        this.state = 0 /* Connecting */;
        this.nackQueue = new Set();
        this.ackQueue = [];
        this.nacking = new Set();
        this.nextDatagram = new DataPacket_1.DataPacket();
        this.recvQueue = [];
        this.splitPackets = new Map();
        this.recoveryList = new Map();
        this.receiveWindow = new SlidingReceiveWindow(256);
        this.reliableReceiveWindow = new SlidingOrderedWindow(256);
        // TODO: ReliableOrdered channels
        this.channelIndex = [];
        this.lastUpdate = Date.now();
        this.sendMessageIndex = 0;
        this.sendSequenceNumber = 0;
        this.sendSplitID = 0;
        this.running = true;
        this.listener = listener;
        this.mtuSize = mtuSize;
        this.address = address;
        this.inLog = (...args) => debug('-> ', ...args);
        this.outLog = (...args) => debug('<- ', ...args);
        for (let i = 0; i < 32; i++) {
            this.channelIndex[i] = 0;
        }
    }
    /**
     * Called by listener to run connection ops
     * @param timestamp current tick time
     */
    update(timestamp) {
        if (this.running && (this.lastUpdate + CONNECTION_TIMEOUT) < timestamp) {
            this.disconnect('timeout');
            return;
        }
        if (this.recvQueue.length) {
            const messages = this.recvQueue.splice(0, 4);
            for (const message of messages) {
                this.receiveOnline(message);
            }
        }
        // if (this.sendQ.length) {
        //   const messages = this.sendQ.splice(0, 1)
        //   for (const message of messages) {
        //     this.sendPacket(message)
        //   }
        // }
        // Send ACKs
        if (this.ackQueue.length > 0) {
            const pk = new ACK_1.default();
            pk.packets = this.ackQueue;
            pk.encode();
            this.sendPacket(pk);
            this.ackQueue = [];
        }
        // Send NACKs
        if (this.nackQueue.size) {
            const pk = new NACK_1.default();
            pk.packets = [...this.nackQueue];
            pk.encode();
            this.outLog('Sending NACK batch', this.nackQueue);
            this.sendPacket(pk);
            for (const nak of this.nackQueue) {
                this.nacking.add(nak);
            }
            this.nackQueue.clear();
        }
        // TODO: Resend packets where we don't get an ACK. Not a big deal since
        // we expect a NACK back anyways.
        this.sendQueue();
    }
    disconnect(reason = 'unknown') {
        this.state = 2 /* Disconnecting */;
        this.listener.close(reason);
    }
    recieve(buffer) {
        this.recvQueue.push(buffer);
        this.lastUpdate = Date.now();
    }
    /**
     * Recieve online RakNet packets
     */
    receiveOnline(buffer) {
        const header = buffer.readUInt8();
        if ((header & bitflags_1.default.Valid) == 0) {
            // Don't handle offline packets
            return;
        }
        else if (header & bitflags_1.default.Ack) {
            return this.handleACK(buffer);
        }
        else if (header & bitflags_1.default.Nack) {
            return this.handleNACK(buffer);
        }
        else {
            return this.handleDatagram(buffer);
        }
    }
    handleACK(buffer) {
        let packet = new ACK_1.default();
        packet.buffer = buffer;
        packet.decode();
        for (let seq of packet.packets) {
            if (this.recoveryList.has(seq)) {
                // Calc ping maybe
                this.recoveryList.delete(seq);
            }
        }
    }
    handleNACK(buffer) {
        let packet = new NACK_1.default();
        packet.buffer = buffer;
        packet.decode();
        this.inLog('[raknet] -> NACK', packet.packets);
        for (let seq of packet.packets) {
            if (this.recoveryList.has(seq)) {
                let pk = this.recoveryList.get(seq);
                // pk.sendTime = Date.now()
                this.outLog('[raknet] resending NACK', pk);
                // this.sendPacket(pk)
                this.listener.sendBuffer(pk.buffer, this.address);
                this.outLog('[raknet] sent', pk);
                this.recoveryList.delete(seq);
            }
            else {
                // This is bad. The connection will probably now die if encryption is enabled.
                this.inLog('** LOST PACKET', seq);
            }
        }
    }
    handleDatagram(buffer) {
        const dataPacket = DataPacket_1.DataPacket.from(buffer);
        console.assert(dataPacket.sequenceNumber != null, 'Packet sequence number cannot be null');
        // this.inLog('Reading datagram', buffer, dataPacket)
        this.ackQueue.push(dataPacket.sequenceNumber);
        this.receiveWindow.set(dataPacket.sequenceNumber, dataPacket);
        const [missing, have] = this.receiveWindow.read();
        // this.inLog('Reading', missing, have)
        for (const miss of missing) {
            if (!this.nacking.has(miss))
                this.nackQueue.add(miss);
        }
        if (this.nackQueue.size)
            this.inLog('NACKs while reading datagram', this.nackQueue, this.nacking);
        for (const datagram of have) {
            if (this.nacking.has(datagram.sequenceNumber) || this.nackQueue.has(datagram.sequenceNumber)) {
                this.inLog('Recieved lost #', datagram.sequenceNumber);
                this.nacking.delete(datagram.sequenceNumber);
                this.nackQueue.delete(datagram.sequenceNumber);
            }
            for (const packet of datagram.packets) {
                this.recievePacket(packet);
            }
        }
    }
    recievePacket(packet) {
        // this.inLog('-> Encapsulated', packet, packet.isReliable())
        if (packet.isReliable()) {
            this.reliableReceiveWindow.set(packet.messageIndex, packet);
            const readable = this.reliableReceiveWindow.read((lost) => debug('Lost ordered', lost, 'currently at', packet.messageIndex));
            this.inLog('Reading reliable', readable);
            for (const pak of readable) {
                this.handlePacket(pak);
            }
        }
        else {
            this.handlePacket(packet);
        }
    }
    handleSplit(packet) {
        if (!this.splitPackets.has(packet.splitID)) {
            this.splitPackets.set(packet.splitID, new Map([[packet.splitIndex, packet]]));
        }
        const splitPacket = this.splitPackets.get(packet.splitID);
        splitPacket.set(packet.splitIndex, packet);
        if (splitPacket.size === packet.splitCount) {
            const bufs = [];
            for (let i = 0; i < packet.splitCount; i++) {
                bufs.push(splitPacket.get(i).buffer);
            }
            const encapsulated = new EncapsulatedPacket_1.default();
            encapsulated.buffer = Buffer.concat(bufs);
            this.splitPackets.delete(packet.splitID);
            this.handlePacket(encapsulated);
        }
        else {
            // debug('Waiting for split', packet.messageIndex, packet.splitID, packet.splitIndex, '/' , packet.splitCount)
        }
    }
    async handlePacket(packet) {
        if (packet.split) {
            this.inLog('reading split');
            this.handleSplit(packet);
            return;
        }
        const id = packet.buffer.readUInt8();
        // this.inLog('--> Encapsulated, h id', id, this.state, Status.Connecting)
        if (id < 0x80) {
            if (this.state == 0 /* Connecting */) {
                if (id === Identifiers_1.default.ConnectionRequest && this.listener.server) {
                    this.inLog('got connection request');
                    this.handleConnectionRequest(packet.buffer);
                }
                else if (id === Identifiers_1.default.NewIncomingConnection && this.listener.server) {
                    const pak = NewIncomingConnection_1.default.from(packet.buffer);
                    const serverAddress = this.listener.socket.address();
                    // debug('incoming connection', serverAddress, pak.address)
                    if (serverAddress.port === pak.address.port) {
                        this.state = 1 /* Connected */;
                        this.listener.emit('openConnection', this);
                    }
                }
                else if (id === Identifiers_1.default.ConnectionRequestAccepted && this.listener.client) {
                    await this.handleConnectionRequestAccepted(packet.buffer);
                    this.inLog('Connected!');
                    this.state = 1 /* Connected */;
                    this.listener.emit('connected', this);
                }
            }
            else if (id === Identifiers_1.default.DisconnectNotification) {
                this.disconnect('client disconnect');
            }
            else if (id === Identifiers_1.default.ConnectedPing) {
                await this.handleConnectedPing(packet.buffer);
            }
            else if (id === Identifiers_1.default.ConnectedPong) {
                await this.handleConnectedPong(packet.buffer);
            }
        }
        else if (this.state === 1 /* Connected */) {
            this.listener.emit('encapsulated', packet, this.address); // To fit in software needs later
        }
    }
    async handleConnectionRequestAccepted(buffer) {
        if (this.listener instanceof Server_1.Server)
            return;
        this.inLog('Connection accepted');
        let dataPacket = new ConnectionRequestAccepted_1.default();
        dataPacket.buffer = buffer;
        dataPacket.decode();
        const pk = new NewIncomingConnection_1.default();
        pk.address = this.listener.address;
        pk.systemAddresses = [];
        for (let i = 0; i < 20; i++) {
            pk.systemAddresses.push(this.listener.address);
        }
        pk.requestTimestamp = dataPacket.requestTimestamp;
        pk.acceptedTimestamp = dataPacket.acceptedTimestamp;
        pk.encode();
        let sendPacket = new EncapsulatedPacket_1.default();
        sendPacket.reliability = 0;
        sendPacket.buffer = pk.buffer;
        this.addToQueue(sendPacket, Priority.Immediate);
    }
    async handleConnectionRequest(buffer) {
        const dataPacket = ConnectionRequest_1.default.from(buffer);
        let pk = new ConnectionRequestAccepted_1.default();
        pk.clientAddress = this.address;
        pk.requestTimestamp = dataPacket.requestTimestamp;
        pk.acceptedTimestamp = BigInt(Date.now());
        pk.encode();
        let sendPacket = new EncapsulatedPacket_1.default();
        sendPacket.reliability = 0;
        sendPacket.buffer = pk.buffer;
        this.addToQueue(sendPacket);
        this.outLog('Sending connection accept', pk);
    }
    async handleConnectedPing(buffer) {
        let dataPacket = new ConnectedPing_1.default();
        dataPacket.buffer = buffer;
        dataPacket.decode();
        let pk = new ConnectedPong_1.default();
        pk.clientTimestamp = dataPacket.clientTimestamp;
        pk.serverTimestamp = BigInt(Date.now());
        pk.encode();
        let sendPacket = new EncapsulatedPacket_1.default();
        sendPacket.reliability = 0;
        sendPacket.buffer = pk.buffer;
        this.addToQueue(sendPacket);
    }
    sendConnectedPing() {
        const pk = new ConnectedPing_1.default();
        pk.clientTimestamp = BigInt(Date.now());
        pk.encode();
        let sendPacket = new EncapsulatedPacket_1.default();
        sendPacket.reliability = 0;
        sendPacket.buffer = pk.buffer;
        this.addToQueue(sendPacket, 1);
    }
    handleConnectedPong(buffer) {
        if (this.listener instanceof Server_1.Server)
            return;
        const pk = ConnectedPong_1.default.from(buffer);
        this.listener.lastPong = BigInt(pk.serverTimestamp || Date.now());
    }
    sendConnectionRequest(clientGUID, mtuSize) {
        const packet = new ConnectionRequest_1.default();
        // packet.mtuSize = mtuSize
        packet.clientGUID = clientGUID;
        packet.requestTimestamp = BigInt(Date.now());
        packet.encode();
        let sendPacket = new EncapsulatedPacket_1.default();
        sendPacket.reliability = 0;
        sendPacket.buffer = packet.buffer;
        this.addToQueue(sendPacket, 1);
        this.outLog('Sending connection request');
    }
    /**
     * Sends an EncapsulatedPacket with a message index if ordered, and splits
     * if needed.
     * @param packet The packet to send
     * @param flags Whether or not to queue this packet or send now
     */
    addEncapsulatedToQueue(packet, flags = Priority.Normal) {
        if (reliability_1.default.isReliable(packet.reliability)) {
            packet.messageIndex = this.sendMessageIndex++;
            if (packet.reliability == reliability_1.default.ReliableOrdered) {
                packet.orderIndex = this.channelIndex[packet.orderChannel]++;
            }
        }
        if (packet.getTotalLength() + 4 > this.mtuSize) {
            let buffers = [], i = 0, splitIndex = 0;
            while (i < packet.buffer.length) {
                // Push format: [chunk index: int, chunk: buffer]
                buffers.push([(splitIndex += 1) - 1, packet.buffer.slice(i, i += this.mtuSize - 60)]);
            }
            let splitID = ++this.sendSplitID % 65536;
            for (let [count, buffer] of buffers) {
                let pk = new EncapsulatedPacket_1.default();
                pk.splitID = splitID;
                pk.split = true;
                pk.splitCount = buffers.length;
                pk.reliability = packet.reliability;
                pk.splitIndex = count;
                pk.buffer = buffer;
                if (count > 0) {
                    pk.messageIndex = this.sendMessageIndex++;
                }
                else {
                    pk.messageIndex = packet.messageIndex;
                }
                if (pk.reliability === 3) {
                    pk.orderChannel = packet.orderChannel;
                    pk.orderIndex = packet.orderIndex;
                }
                this.addToQueue(pk, flags | Priority.Immediate);
            }
        }
        else {
            this.addToQueue(packet, flags);
        }
    }
    // Adds a packet to the queue
    addToQueue(pk, flags = Priority.Normal) {
        let priority = flags & 0b1;
        if (priority === Priority.Immediate) {
            const packet = new DataPacket_1.DataPacket();
            packet.sequenceNumber = this.sendSequenceNumber++;
            packet.packets.push(pk.toBinary());
            packet.encode();
            this.sendPacket(packet);
            // packet.sendTime = Date.now()  
            this.recoveryList.set(packet.sequenceNumber, packet);
            // this.outLog('Immedate Sent Q #', packet.sequenceNumber)
            return;
        }
        const length = this.nextDatagram.length();
        if (length + pk.getTotalLength() > this.mtuSize) {
            this.sendQueue();
        }
        this.nextDatagram.packets.push(pk.toBinary());
    }
    sendQueue() {
        if (this.nextDatagram.packets.length > 0) {
            this.nextDatagram.sequenceNumber = this.sendSequenceNumber++;
            this.nextDatagram.encode();
            this.sendPacket(this.nextDatagram);
            // this.sendQueue.sendTime = Date.now()
            // console.log('Normal Sent Q #', this.nextDatagram.sequenceNumber)
            this.recoveryList.set(this.nextDatagram.sequenceNumber, this.nextDatagram);
            this.nextDatagram = new DataPacket_1.DataPacket();
        }
    }
    sendPacket(packet) {
        this.listener.sendBuffer(packet.buffer, this.address);
    }
    close() {
        this.state = 3 /* Disconnected */;
        const stream = new jsbinaryutils_1.default(Buffer.from('\x00\x00\x08\x15', 'binary'));
        this.addEncapsulatedToQueue(EncapsulatedPacket_1.default.fromBinary(stream), Priority.Immediate); // Client discconect packet 0x15
    }
}
exports.Connection = Connection;
