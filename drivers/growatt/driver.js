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
            await api.login();
            const deviceData = await api.getDeviceData();
            const devices = deviceData.map(({ id, plantId }) => ({
                name: id,
                data: { id, plantId },
                settings: { username, password },
            }));
            return devices;
        });
    }
}
module.exports = GrowattDriver;
