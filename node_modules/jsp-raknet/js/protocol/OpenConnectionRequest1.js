"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Identifiers = require('./Identifiers');
const OfflinePacket_1 = __importDefault(require("./OfflinePacket"));
class OpenConnectionRequest1 extends OfflinePacket_1.default {
    constructor(buffer) {
        super(Identifiers.OpenConnectionRequest1, buffer);
    }
    decode() {
        super.decode();
        this.mtuSize = Buffer.byteLength(this.getBuffer()) + 28;
        this.readMagic();
        this.protocol = this.readByte();
    }
    encode() {
        super.encode();
        this.writeMagic();
        this.writeByte(this.protocol);
        const length = this.mtuSize - this.getBuffer().byteLength - 1;
        const buf = Buffer.alloc(length).fill(0x00);
        this.append(buf);
    }
}
exports.default = OpenConnectionRequest1;
