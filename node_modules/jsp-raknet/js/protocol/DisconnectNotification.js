"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Identifiers = require('./Identifiers');
const OfflinePacket_1 = __importDefault(require("./OfflinePacket"));
class DisconnectNotification extends OfflinePacket_1.default {
    constructor() {
        super(Identifiers.DisconnectNotification);
    }
}
exports.default = DisconnectNotification;
