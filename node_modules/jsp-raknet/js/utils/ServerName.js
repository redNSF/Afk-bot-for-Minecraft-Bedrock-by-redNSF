"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ServerName {
    constructor() {
        this.motd = 'JSRakNet - JS powered RakNet';
        this.name = 'JSRakNet';
        this.protocol = 408;
        this.version = '1.16.20';
        this.players = {
            online: 0,
            max: 5
        };
        this.gamemode = 'Creative';
        this.serverId = '0';
    }
    toString() {
        return [
            'MCPE',
            this.motd,
            this.protocol,
            this.version,
            this.players.online,
            this.players.max,
            this.serverId,
            this.name,
            this.gamemode
        ].join(';') + ';';
    }
}
exports.default = ServerName;
