"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Identifiers = require('./Identifiers');
const OfflinePacket_1 = __importDefault(require("./OfflinePacket"));
class OpenConnectionReply1 extends OfflinePacket_1.default {
    constructor(buffer) {
        super(Identifiers.OpenConnectionReply1, buffer);
    }
    decode() {
        super.decode();
        this.readMagic();
        this.serverGUID = this.readLong();
        this.readByte(); // Secure
        this.mtuSize = this.readShort();
    }
    encode() {
        super.encode();
        this.writeMagic();
        this.writeLong(this.serverGUID);
        this.writeByte(0); // Secure
        this.writeShort(this.mtuSize);
    }
}
exports.default = OpenConnectionReply1;
