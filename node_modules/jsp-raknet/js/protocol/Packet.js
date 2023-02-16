"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsbinaryutils_1 = __importDefault(require("@jsprismarine/jsbinaryutils"));
const InetAddress_1 = __importDefault(require("../utils/InetAddress"));
// Basic class template
// @ts-ignore
class Packet extends jsbinaryutils_1.default {
    constructor(id, buffer) {
        super(buffer);
        this.id = id;
    }
    get reaminingBytes() {
        return this.buffer.byteLength - this.offset;
    }
    // Decodes packet buffer
    decode() {
        this.readByte(); // Skip the packet ID
    }
    // Encodes packet buffer
    encode() {
        this.writeByte(this.id);
    }
    // Reads a string from the buffer
    readString() {
        return this.read(this.readShort()).toString();
    }
    // Writes a string length + buffer 
    // valid only for offline packets
    writeString(v) {
        this.writeShort(Buffer.byteLength(v));
        this.append(Buffer.from(v, 'utf-8'));
    }
    // Reads a RakNet address passed into the buffer 
    readAddress() {
        let ver = this.readByte();
        if (ver == 4) {
            // Read 4 bytes 
            let ipBytes = this.buffer.slice(this.offset, this.addOffset(4, true));
            const decoded = ~ipBytes;
            const hostname = `${(decoded >> 24) & 0xff}.${(decoded >> 16) & 0xff}.${(decoded >> 8) & 0xff}.${decoded & 0xff}`;
            let port = this.readShort();
            return new InetAddress_1.default(hostname, port, ver);
        }
        else {
            this.offset += 2; // Skip 2 bytes, AF
            let port = this.readShort();
            this.offset += 4; // Skip 4 bytes, flow
            let addr = this.buffer.slice(this.offset, this.offset += 16);
            this.offset += 4; // Skip 4 bytes, scope ID
            return new InetAddress_1.default(addr, port, ver);
        }
    }
    // Writes an IPv4 address into the buffer
    // Needs to get refactored, also needs to be added support for IPv6
    writeAddress(address) {
        this.writeByte(address.version || 4);
        address.address.split('.', 4).forEach(b => this.writeByte(-b - 1));
        this.writeShort(address.port);
    }
}
exports.default = Packet;
