"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const InetAddress_1 = __importDefault(require("../utils/InetAddress"));
const Packet_1 = __importDefault(require("./Packet"));
const Identifiers = require('./Identifiers');
class NewIncomingConnection extends Packet_1.default {
    constructor() {
        super(Identifiers.NewIncomingConnection);
        this.systemAddresses = new Array(20).fill(new InetAddress_1.default('0.0.0.0', 0, 4));
    }
    decode() {
        super.decode();
        this.address = this.readAddress();
        // Do not save in memory stuff we will not use
        for (let i = 0; i < 20; i++) {
            const address = this.readAddress();
            this.systemAddresses.push(address);
            if (this.reaminingBytes === 16)
                break;
        }
        this.requestTimestamp = this.readLong();
        this.acceptedTimestamp = this.readLong();
    }
    encode() {
        super.encode();
        this.writeAddress(this.address);
        for (let i = 0; i < 20; i++) {
            this.writeAddress(this.systemAddresses[i]);
        }
        this.writeLong(this.requestTimestamp);
        this.writeLong(this.acceptedTimestamp);
    }
    static from(buffer) {
        const e = new NewIncomingConnection();
        e.buffer = buffer;
        e.decode();
        return e;
    }
}
exports.default = NewIncomingConnection;
