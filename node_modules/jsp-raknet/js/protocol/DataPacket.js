"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataPacket = void 0;
const Packet_1 = __importDefault(require("./Packet"));
const EncapsulatedPacket_1 = __importDefault(require("./EncapsulatedPacket"));
const bitflags_1 = __importDefault(require("./bitflags"));
class DataPacket extends Packet_1.default {
    constructor() {
        super(bitflags_1.default.Valid | 0);
        this.packets = [];
    }
    decode() {
        super.decode();
        this.sequenceNumber = this.readLTriad();
        while (!this.feof()) {
            this.packets.push(EncapsulatedPacket_1.default.fromBinary(this));
        }
    }
    encode() {
        super.encode();
        this.writeLTriad(this.sequenceNumber);
        for (let packet of this.packets) {
            this.append(packet instanceof EncapsulatedPacket_1.default ? packet.toBinary() : packet.buffer);
        }
    }
    length() {
        let length = 4;
        for (let packet of this.packets) {
            length += packet instanceof EncapsulatedPacket_1.default ? packet.getTotalLength() : packet.buffer.length;
        }
        return length;
    }
    static from(buffer) {
        const dataPacket = new DataPacket();
        dataPacket.buffer = buffer;
        dataPacket.decode();
        return dataPacket;
    }
}
exports.DataPacket = DataPacket;
