"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = require("homey");
const api_1 = __importDefault(require("./api"));
class GrowattDriver extends homey_1.Driver {
    async onPair(session) {
        let username = "";
        let password = "";
        session.setHandler("login", async (data) => {
            username = data.username;
            password = data.password;
            const api = new api_1.default(username, password);
            await api.login();
            return true;
        });
        session.setHandler("list_devices", async () => {
            const api = new api_1.default(username, password);
            const serialNumbers = await api.getInverterSerialNumbers();
            const devices = serialNumbers.map((serialNumber) => ({
                name: serialNumber,
                data: { id: serialNumber },
                settings: { username, password },
            }));
            return devices;
        });
    }
}
module.exports = GrowattDriver;
//# sourceMappingURL=driver.js.map