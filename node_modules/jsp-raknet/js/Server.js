"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const dgram_1 = __importDefault(require("dgram"));
const crypto_1 = __importDefault(require("crypto"));
const events_1 = __importDefault(require("events"));
const Connection_1 = require("./Connection");
const Identifiers_1 = __importDefault(require("./protocol/Identifiers"));
const UnconnectedPong_1 = __importDefault(require("./protocol/UnconnectedPong"));
const OpenConnectionRequest1_1 = __importDefault(require("./protocol/OpenConnectionRequest1"));
const OpenConnectionRequest2_1 = __importDefault(require("./protocol/OpenConnectionRequest2"));
const IncompatibleProtocolVersion_1 = __importDefault(require("./protocol/IncompatibleProtocolVersion"));
const OpenConnectionReply1_1 = __importDefault(require("./protocol/OpenConnectionReply1"));
const OpenConnectionReply2_1 = __importDefault(require("./protocol/OpenConnectionReply2"));
const UnconnectedPing_1 = __importDefault(require("./protocol/UnconnectedPing"));
const InetAddress_1 = __importDefault(require("./utils/InetAddress"));
const debug = require('debug')('raknet');
// RakNet protocol versions 
const RAKNET_PROTOCOL = 10;
const RAKNET_TPS = 100;
const RAKNET_TICK_LENGTH = 1 / RAKNET_TPS;
class Server extends events_1.default {
    constructor(hostname, port, serverName) {
        super();
        this.server = true;
        this.client = false;
        this.running = true;
        this.connections = new Map();
        this.serverName = serverName;
        this.serverId = crypto_1.default.randomBytes(8).readBigInt64BE(0);
        this.hostname = hostname;
        this.port = port;
        this.inLog = (...args) => debug('S -> ', hostname, ...args);
        this.outLog = (...args) => debug('S <- ', hostname, ...args);
    }
    async listen() {
        this.socket = dgram_1.default.createSocket({ type: 'udp4', recvBufferSize: 1024 * 256 * 2, sendBufferSize: 1024 * 16 });
        this.serverName.serverId = this.serverId.toString();
        this.socket.on('message', (buffer, rinfo) => {
            this.inLog('[C->S]', buffer, rinfo);
            const sender = new InetAddress_1.default(rinfo.address, rinfo.port);
            this.handle(buffer, sender);
        });
        await new Promise((resolve, reject) => {
            const failFn = e => reject(e);
            this.socket.once('error', failFn);
            this.socket.bind(this.port, this.hostname, () => {
                this.socket.removeListener('error', failFn);
                resolve(true);
            });
        });
        this.startTicking(); // tick sessions
        return this;
    }
    handle(buffer, sender) {
        const header = buffer.readUInt8(); // Read packet header to recognize packet type
        if (this.connections.has(sender.hash)) {
            const connection = this.connections.get(sender.hash);
            connection.recieve(buffer);
        }
        else { // Offline
            switch (header) {
                case Identifiers_1.default.UnconnectedPing:
                    this.sendBuffer(this.handleUnconnectedPing(buffer), sender);
                    break;
                case Identifiers_1.default.OpenConnectionRequest1:
                    this.sendBuffer(this.handleOpenConnectionRequest1(buffer), sender);
                    break;
                case Identifiers_1.default.OpenConnectionRequest2:
                    this.sendBuffer(this.handleOpenConnectionRequest2(buffer, sender), sender);
                    break;
            }
        }
    }
    sendBuffer(sendBuffer, client) {
        this.outLog('<- ', sendBuffer, client);
        this.socket.send(sendBuffer, 0, sendBuffer.length, client.port, client.address);
    }
    setPongAdvertisement(ad) {
        this.serverName = ad;
    }
    handleUnconnectedPing(buffer) {
        // Decode server packet
        const decodedPacket = new UnconnectedPing_1.default();
        decodedPacket.buffer = buffer;
        decodedPacket.decode();
        // Check packet validity
        // To refactor
        if (!decodedPacket.isValid()) {
            throw new Error('Received an invalid offline message');
        }
        // Encode response
        const packet = new UnconnectedPong_1.default();
        packet.sendTimestamp = decodedPacket.sendTimestamp;
        packet.serverGUID = this.serverId;
        let serverQuery = this.serverName;
        this.emit('unconnectedPong', serverQuery);
        packet.serverName = serverQuery.toString();
        packet.encode();
        return packet.buffer;
    }
    handleOpenConnectionRequest1(buffer) {
        // Decode server packet
        const decodedPacket = new OpenConnectionRequest1_1.default();
        decodedPacket.buffer = buffer;
        decodedPacket.decode();
        // Check packet validity
        // To refactor
        if (!decodedPacket.isValid()) {
            throw new Error('Received an invalid offline message');
        }
        if (decodedPacket.protocol !== RAKNET_PROTOCOL) {
            const packet = new IncompatibleProtocolVersion_1.default();
            packet.protocol = RAKNET_PROTOCOL;
            packet.serverGUID = this.serverId;
            packet.encode();
            return packet.buffer;
        }
        // Encode response
        const packet = new OpenConnectionReply1_1.default();
        packet.serverGUID = this.serverId;
        packet.mtuSize = Math.min(decodedPacket.mtuSize, 1400);
        packet.encode();
        return packet.buffer;
    }
    handleOpenConnectionRequest2(buffer, address) {
        // Decode server packet
        const decodedPacket = new OpenConnectionRequest2_1.default();
        decodedPacket.buffer = buffer;
        decodedPacket.decode();
        // Check packet validity
        // To refactor
        if (!decodedPacket.isValid()) {
            throw new Error('Received an invalid offline message');
        }
        // Encode response
        const packet = new OpenConnectionReply2_1.default();
        packet.serverGUID = this.serverId;
        packet.mtuSize = Math.min(decodedPacket.mtuSize, 1400);
        packet.clientAddress = address;
        packet.encode();
        // Create a session
        const conn = new Connection_1.Connection(this, decodedPacket.mtuSize, address);
        conn.inLog = this.inLog;
        conn.outLog = this.outLog;
        this.connections.set(address.hash, conn);
        return packet.buffer;
    }
    startTicking() {
        const int = setInterval(() => {
            if (this.running) {
                for (const [_, connection] of this.connections) {
                    connection.update(Date.now());
                }
            }
            else {
                this.emit('closing');
                clearInterval(int);
            }
        }, RAKNET_TICK_LENGTH * 1000);
    }
    close() {
        if (!this.running)
            return;
        this.running = false;
        // Wait some time for final packets to go through
        setTimeout(() => {
            for (const [k, v] of this.connections) {
                v.close();
            }
            this.socket.close(() => {
                this.emit('close');
                this.removeAllListeners();
            });
        }, 100);
    }
}
exports.Server = Server;
