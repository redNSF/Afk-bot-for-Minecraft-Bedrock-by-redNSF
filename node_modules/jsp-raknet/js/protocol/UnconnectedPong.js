"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Identifiers = require('./Identifiers');
const OfflinePacket_1 = __importDefault(require("./OfflinePacket"));
class UnconnectedPong extends OfflinePacket_1.default {
    constructor(buffer) {
        super(Identifiers.UnconnectedPong, buffer);
    }
    decode() {
        super.decode();
        this.sendTimestamp = this.readLong();
        this.serverGUID = this.readLong();
        this.readMagic();
        this.serverName = this.readString();
    }
    encode() {
        super.encode();
        this.writeLong(this.sendTimestamp);
        this.writeLong(this.serverGUID);
        this.writeMagic();
        this.writeString(this.serverName);
    }
}
exports.default = UnconnectedPong;
