"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = require("homey");
const api_1 = __importDefault(require("./api"));
class PvOutputDriver extends homey_1.Driver {
    async onPair(session) {
        session.setHandler("validate", async (data) => {
            this.homey.log("Pair data received");
            const { apiKey, systemId } = data;
            this.apiKey = apiKey;
            this.systemId = systemId;
            return new api_1.default(this.systemId, this.apiKey).getSystemName();
        });
        session.setHandler("list_devices", async () => {
            this.homey.log("Listing devices");
            const devicesList = [];
            if (this.apiKey && this.systemId) {
                const systemName = await new api_1.default(this.systemId, this.apiKey).getSystemName();
                devicesList.push({
                    name: systemName,
                    data: {
                        sid: this.systemId,
                    },
                    settings: {
                        key: this.apiKey,
                    },
                });
            }
            return devicesList;
        });
    }
}
module.exports = PvOutputDriver;
//# sourceMappingURL=driver.js.map