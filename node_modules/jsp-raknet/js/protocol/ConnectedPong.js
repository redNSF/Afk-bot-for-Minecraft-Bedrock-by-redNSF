"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Packet_1 = __importDefault(require("./Packet"));
const Identifiers_1 = __importDefault(require("./Identifiers"));
class ConnectedPong extends Packet_1.default {
    constructor() {
        super(Identifiers_1.default.ConnectedPong);
    }
    encode() {
        super.encode();
        this.writeLong(this.clientTimestamp);
        this.writeLong(this.serverTimestamp);
    }
    decode() {
        super.decode();
        this.clientTimestamp = this.readLong();
        this.serverTimestamp = this.readLong();
    }
    static from(buffer) {
        const pak = new ConnectedPong();
        pak.buffer = buffer;
        pak.decode();
        return pak;
    }
}
exports.default = ConnectedPong;
