"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = require("homey");
const api_1 = __importDefault(require("./api"));
class SolarEdgeDriver extends homey_1.Driver {
    async onPair(session) {
        session.setHandler("validate", async (data) => {
            this.homey.log("Pair data received");
            const { apiKey } = data;
            this.apiKey = apiKey;
            return new api_1.default(apiKey).getSites();
        });
        session.setHandler("list_devices", async () => {
            this.homey.log("Listing devices");
            const devicesList = [];
            if (this.apiKey) {
                const sitesList = await new api_1.default(this.apiKey).getSites();
                for (const site of sitesList.sites.site) {
                    const equipmentList = await new api_1.default(this.apiKey, site.id).getEquipmentList();
                    const inverterCount = equipmentList.reporters.list.length;
                    for (const reporter of equipmentList.reporters.list) {
                        devicesList.push({
                            name: `${reporter.name} (${reporter.manufacturer} ${reporter.model})`,
                            data: {
                                sid: site.id,
                                serial_number: reporter.serialNumber,
                            },
                            settings: { key: this.apiKey, interval: 15 * inverterCount },
                        });
                    }
                }
            }
            return devicesList;
        });
    }
}
module.exports = SolarEdgeDriver;
//# sourceMappingURL=driver.js.map