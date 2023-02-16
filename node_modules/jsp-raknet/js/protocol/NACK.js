"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AcknowledgePacket_1 = __importDefault(require("./AcknowledgePacket"));
const Identifiers_1 = __importDefault(require("./Identifiers"));
class NACK extends AcknowledgePacket_1.default {
    constructor(buffer) {
        super(Identifiers_1.default.NacknowledgePacket, buffer);
    }
}
exports.default = NACK;
