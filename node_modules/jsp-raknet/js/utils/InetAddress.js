"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InetAddress {
    constructor(address, port, version = 4) {
        this.address = address;
        this.port = port;
        this.version = version;
        this.hash = address + '/' + port;
    }
}
exports.default = InetAddress;
