"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Packet_1 = __importDefault(require("./Packet"));
const Identifiers_1 = __importDefault(require("./Identifiers"));
class ConnectionRequest extends Packet_1.default {
    constructor() {
        super(Identifiers_1.default.ConnectionRequest);
    }
    decode() {
        super.decode();
        this.clientGUID = this.readLong();
        this.requestTimestamp = this.readLong();
        this.readByte(); // secure
    }
    encode() {
        super.encode();
        this.writeLong(this.clientGUID);
        this.writeLong(this.requestTimestamp);
        this.writeByte(0); // secure
    }
    static from(buffer) {
        const pak = new ConnectionRequest();
        pak.buffer = buffer;
        pak.decode();
        return pak;
    }
}
exports.default = ConnectionRequest;
