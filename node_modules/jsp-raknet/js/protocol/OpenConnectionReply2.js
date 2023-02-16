"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Identifiers = require('./Identifiers');
const OfflinePacket_1 = __importDefault(require("./OfflinePacket"));
class OpenConnectionReply2 extends OfflinePacket_1.default {
    constructor(buffer) {
        super(Identifiers.OpenConnectionReply2, buffer);
    }
    decode() {
        super.decode();
        this.readMagic();
        this.serverGUID = this.readLong();
        this.clientAddress = this.readAddress();
        this.mtuSize = this.readShort();
        this.readByte(); // Secure
    }
    encode() {
        super.encode();
        this.writeMagic();
        this.writeLong(this.serverGUID);
        this.writeAddress(this.clientAddress);
        this.writeShort(this.mtuSize);
        this.writeByte(0); // Secure
    }
}
exports.default = OpenConnectionReply2;
