"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inverter_1 = require("../../inverter");
const api_1 = __importDefault(require("./api"));
class GrowattDevice extends inverter_1.Inverter {
    constructor() {
        super(...arguments);
        this.interval = 60;
    }
    async onInit() {
        const settings = this.getSettings();
        this.api = new api_1.default(settings.username, settings.password);
        await this.api.login();
        super.onInit();
    }
    async onSettings({ newSettings }) {
        // TODO: fix typing once Athom fixes their TypeScript implementation
        const typedNewSettings = newSettings;
        const api = new api_1.default(typedNewSettings.username, typedNewSettings.password);
        await api.login();
        this.api = api;
    }
    async checkProduction() {
        this.homey.log("Checking production");
        const data = this.getData();
        if (this.api) {
            const production = await this.api.getInverterProductionData(data.id);
            if (production !== null) {
                const currentEnergy = production.energyToday;
                const currentPower = production.currentPower;
                this.setCapabilityValue("meter_power", currentEnergy);
                this.setCapabilityValue("measure_power", currentPower);
                this.homey.log(`Current energy is ${currentEnergy}kWh`);
                this.homey.log(`Current power is ${currentPower}W`);
                await this.setAvailable();
            }
            else {
                await this.setUnavailable("Could not retrieve Growatt production data");
            }
        }
        else {
            await this.setUnavailable("Growatt API connection not initialized");
        }
    }
}
module.exports = GrowattDevice;
//# sourceMappingURL=device.js.map