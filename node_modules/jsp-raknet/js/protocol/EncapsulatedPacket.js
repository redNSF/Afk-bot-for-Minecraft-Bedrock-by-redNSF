"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsbinaryutils_1 = __importDefault(require("@jsprismarine/jsbinaryutils"));
const bitflags_1 = __importDefault(require("./bitflags"));
const reliability_1 = __importDefault(require("./reliability"));
class EncapsulatedPacket {
    constructor() {
        // Reliable message number, used to identify reliable messages on the network
        this.messageIndex = 0;
        // Identifier used with sequenced messages
        this.sequenceIndex = 0;
        // Identifier used for ordering packets, included in sequenced messages
        this.orderIndex = 0;
        // The order channel the packet is on, used just if the reliability type has it
        this.orderChannel = 0;
        // If the packet is splitted, this is the count of splits
        this.splitCount = 0;
        // If the packet is splitted, this ID refers to the index in the splits array
        this.splitIndex = 0;
        // The ID of the split packet (if the packet is splitted)
        this.splitID = 0;
    }
    static fromBinary(stream) {
        let packet = new EncapsulatedPacket();
        let header = stream.readByte();
        packet.reliability = (header & 224) >> 5;
        packet.split = (header & bitflags_1.default.Split) > 0;
        let length = stream.readShort();
        length >>= 3;
        if (length == 0) {
            throw new Error('Got an empty encapsulated packet');
        }
        if (reliability_1.default.isReliable(packet.reliability)) {
            packet.messageIndex = stream.readLTriad();
        }
        if (reliability_1.default.sequenced(packet.reliability)) {
            packet.sequenceIndex = stream.readLTriad();
        }
        if (reliability_1.default.sequencedOrOrdered(packet.reliability)) {
            packet.orderIndex = stream.readLTriad();
            packet.orderChannel = stream.readByte();
        }
        if (packet.split) {
            packet.splitCount = stream.readInt();
            packet.splitID = stream.readShort();
            packet.splitIndex = stream.readInt();
        }
        packet.buffer = stream.buffer.slice(stream.offset, stream.offset + length);
        stream.offset += length;
        return packet;
    }
    toBinary() {
        let stream = new jsbinaryutils_1.default();
        let header = this.reliability << 5;
        if (this.split) {
            header |= bitflags_1.default.Split;
        }
        stream.writeByte(header);
        stream.writeShort(this.buffer.length << 3);
        if (reliability_1.default.isReliable(this.reliability)) {
            stream.writeLTriad(this.messageIndex);
        }
        if (reliability_1.default.sequenced(this.reliability)) {
            stream.writeLTriad(this.sequenceIndex);
        }
        if (reliability_1.default.sequencedOrOrdered(this.reliability)) {
            stream.writeLTriad(this.orderIndex);
            stream.writeByte(this.orderChannel);
        }
        if (this.split) {
            stream.writeInt(this.splitCount);
            stream.writeShort(this.splitID);
            stream.writeInt(this.splitIndex);
        }
        stream.append(this.buffer);
        return stream;
    }
    getTotalLength() {
        return 3 + this.buffer.length +
            (typeof this.messageIndex !== 'undefined' ? 3 : 0) +
            (typeof this.orderIndex !== 'undefined' ? 4 : 0) +
            (this.split ? 10 : 0);
    }
    isReliable() {
        return reliability_1.default.isReliable(this.reliability);
    }
}
exports.default = EncapsulatedPacket;
