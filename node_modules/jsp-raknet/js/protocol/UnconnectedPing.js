"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Identifiers = require('./Identifiers');
const OfflinePacket_1 = __importDefault(require("./OfflinePacket"));
class UnconnectedPing extends OfflinePacket_1.default {
    constructor(buffer) {
        super(Identifiers.UnconnectedPing, buffer);
    }
    decode() {
        super.decode();
        this.sendTimestamp = this.readLong();
        this.readMagic();
        this.clientGUID = this.readLong();
    }
    encode() {
        super.encode();
        this.writeLong(this.sendTimestamp);
        this.writeMagic();
        this.writeLong(this.clientGUID);
    }
}
exports.default = UnconnectedPing;
