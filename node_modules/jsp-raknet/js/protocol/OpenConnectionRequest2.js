"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Identifiers = require('./Identifiers');
const OfflinePacket_1 = __importDefault(require("./OfflinePacket"));
class OpenConnectionRequest2 extends OfflinePacket_1.default {
    constructor(buffer) {
        super(Identifiers.OpenConnectionRequest2, buffer);
    }
    decode() {
        super.decode();
        this.readMagic();
        this.serverAddress = this.readAddress();
        this.mtuSize = this.readShort();
        this.clientGUID = this.readLong();
    }
    encode() {
        super.encode();
        this.writeMagic();
        this.writeAddress(this.serverAddress);
        this.writeShort(this.mtuSize);
        this.writeLong(this.clientGUID);
    }
}
exports.default = OpenConnectionRequest2;
