"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Packet_1 = __importDefault(require("./Packet"));
const MAGIC = Buffer.from('\u0000\u00FF\u00FF\u0000\u00FE\u00FE\u00FE\u00FE\u00FD\u00FD\u00FD\u00FD\u0012\u0034\u0056\u0078', 'binary');
class OfflinePacket extends Packet_1.default {
    // Used to read offline packets magic (needed to validate the packet)
    readMagic() {
        this.magic = this.buffer.slice(this.offset, this.addOffset(16, true));
    }
    writeMagic() {
        this.append(MAGIC);
    }
    isValid() {
        return MAGIC.equals(this.magic);
    }
}
exports.default = OfflinePacket;
