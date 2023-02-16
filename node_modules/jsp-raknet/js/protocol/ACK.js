"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AcknowledgePacket_1 = __importDefault(require("./AcknowledgePacket"));
const Identifiers = require('./Identifiers');
class ACK extends AcknowledgePacket_1.default {
    constructor() {
        // @ts-ignore
        super(Identifiers.AcknowledgePacket);
    }
}
exports.default = ACK;
