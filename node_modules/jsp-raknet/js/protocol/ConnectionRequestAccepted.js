"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const InetAddress_1 = __importDefault(require("../utils/InetAddress"));
const Packet_1 = __importDefault(require("./Packet"));
const Identifiers_1 = __importDefault(require("./Identifiers"));
const ConnectionRequest_1 = __importDefault(require("./ConnectionRequest"));
class ConnectionRequestAccepted extends Packet_1.default {
    constructor() {
        super(Identifiers_1.default.ConnectionRequestAccepted);
    }
    decode() {
        super.decode();
        this.clientAddress = this.readAddress();
        const addressIndex = this.readShort(); // unknown
        for (let i = 0; i < 20; i++) {
            const address = this.readAddress();
            if (this.reaminingBytes === 16)
                break;
        }
        this.requestTimestamp = this.readLong();
        this.acceptedTimestamp = this.readLong();
    }
    encode() {
        super.encode();
        this.writeAddress(this.clientAddress);
        this.writeShort(0); // unknown
        let sysAddresses = [new InetAddress_1.default('127.0.0.1', 0, 4)];
        for (let i = 0; i < 20; i++) {
            this.writeAddress(sysAddresses[i] || new InetAddress_1.default('0.0.0.0', 0, 4));
        }
        this.writeLong(this.requestTimestamp);
        this.writeLong(this.acceptedTimestamp);
    }
    static from(buffer) {
        const pak = new ConnectionRequest_1.default();
        pak.buffer = buffer;
        pak.decode();
        return pak;
    }
}
exports.default = ConnectionRequestAccepted;
