"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Packet_1 = __importDefault(require("./Packet"));
const Identifiers_1 = __importDefault(require("./Identifiers"));
class ConnectedPing extends Packet_1.default {
    constructor() {
        super(Identifiers_1.default.ConnectedPing);
    }
    decode() {
        super.decode();
        this.clientTimestamp = this.readLong();
    }
    encode() {
        super.encode();
        this.writeLong(this.clientTimestamp);
    }
}
exports.default = ConnectedPing;
