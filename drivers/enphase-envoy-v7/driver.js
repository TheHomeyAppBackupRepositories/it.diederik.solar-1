"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = require("homey");
const api_1 = __importDefault(require("./api"));
class EnphaseEnvoyDriver extends homey_1.Driver {
    async onPair(session) {
        let username = null;
        let password = null;
        session.setHandler("login", async (data) => {
            await api_1.default.getEnphaseSessionId(data.username, data.password);
            username = data.username;
            password = data.password;
            return true;
        });
        session.setHandler("list_devices", async () => {
            const discoveryStrategy = this.getDiscoveryStrategy();
            const discoveryResults = discoveryStrategy.getDiscoveryResults();
            const devices = Object.values(discoveryResults).map((discoveryResult) => {
                const typedDiscoveryResult = discoveryResult;
                return {
                    name: `${typedDiscoveryResult.name} (${typedDiscoveryResult.id})`,
                    data: {
                        id: typedDiscoveryResult.id,
                    },
                    settings: { username, password },
                };
            });
            return devices;
        });
    }
}
module.exports = EnphaseEnvoyDriver;
