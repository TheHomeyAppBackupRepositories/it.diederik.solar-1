"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = require("homey");
const api_1 = __importDefault(require("./api"));
class TigoDriver extends homey_1.Driver {
    async onPair(session) {
        let username = "";
        let password = "";
        session.setHandler("login", async (data) => {
            username = data.username;
            password = data.password;
            await new api_1.default(username, password).getSystems();
            return true;
        });
        session.setHandler("list_devices", async () => {
            const systemsResponse = await new api_1.default(username, password).getSystems();
            const devices = systemsResponse.systems.map((system) => {
                return {
                    name: system.name,
                    data: {
                        sid: system.system_id,
                    },
                    settings: {
                        username,
                        password,
                    },
                };
            });
            return devices;
        });
    }
}
module.exports = TigoDriver;
//# sourceMappingURL=driver.js.map