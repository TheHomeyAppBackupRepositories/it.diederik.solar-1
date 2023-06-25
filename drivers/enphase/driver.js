"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = require("homey");
const api_1 = __importDefault(require("./api"));
class EnphaseDriver extends homey_1.Driver {
    async onPair(session) {
        session.setHandler("validate", async (data) => {
            this.homey.log("Pair data received");
            const { userId, apiKey } = data;
            this.userId = userId;
            this.apiKey = apiKey;
            return new api_1.default(userId, apiKey).getSystems();
        });
        session.setHandler("list_devices", async () => {
            this.homey.log("Listing devices");
            if (this.userId && this.apiKey) {
                const systemList = await new api_1.default(this.userId, this.apiKey).getSystems();
                return systemList.systems.map((system) => ({
                    name: system.system_name,
                    data: {
                        id: system.system_id,
                    },
                    settings: { uid: this.userId, key: this.apiKey },
                }));
            }
            return [];
        });
    }
}
module.exports = EnphaseDriver;
//# sourceMappingURL=driver.js.map