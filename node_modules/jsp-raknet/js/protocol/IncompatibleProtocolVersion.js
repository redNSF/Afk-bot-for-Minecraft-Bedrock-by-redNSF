"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Identifiers = require('./Identifiers');
const OfflinePacket_1 = __importDefault(require("./OfflinePacket"));
class IncompatibleProtocolVersion extends OfflinePacket_1.default {
    constructor() {
        super(Identifiers.IncompatibleProtocolVersion);
    }
    encode() {
        super.encode();
        this.writeByte(this.protocol);
        this.writeMagic();
        this.writeLong(this.serverGUID);
    }
    decode() {
        super.decode();
        this.protocol = this.readByte();
        this.readMagic();
        this.serverGUID = this.readLong();
    }
}
exports.default = IncompatibleProtocolVersion;
