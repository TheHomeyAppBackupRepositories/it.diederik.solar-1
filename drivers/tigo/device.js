"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inverter_1 = require("../../inverter");
const api_1 = __importDefault(require("./api"));
class TigoDevice extends inverter_1.Inverter {
    constructor() {
        super(...arguments);
        this.interval = 5;
    }
    async onInit() {
        const data = this.getData();
        const settings = this.getSettings();
        this.api = new api_1.default(settings.username, settings.password, data.sid);
        super.onInit();
    }
    async onSettings({ newSettings, changedKeys, }) {
        // TODO: fix typing once Athom fixes their TypeScript implementation
        const typedNewSettings = newSettings;
        if (changedKeys.includes("username") || changedKeys.includes("password")) {
            const data = this.getData();
            const newApi = new api_1.default(typedNewSettings.username, typedNewSettings.password, data.sid);
            await newApi.getSummary();
            this.api = newApi;
            // Force production check when API key is changed
            this.checkProduction();
        }
    }
    async checkProduction() {
        this.homey.log("Checking production");
        if (this.api) {
            try {
                const systemSummary = await this.api.getSummary();
                const currentEnergy = Number(systemSummary.summary.daily_energy_dc) / 1000;
                this.setCapabilityValue("meter_power", currentEnergy);
                const currentPower = Number(systemSummary.summary.last_power_dc);
                this.setCapabilityValue("measure_power", currentPower);
                this.homey.log(`Current energy is ${currentEnergy}kWh`);
                this.homey.log(`Current power is ${currentPower}W`);
                await this.setAvailable();
            }
            catch (err) {
                const errorMessage = err.message;
                this.homey.log(`Unavailable: ${errorMessage}`);
                await this.setUnavailable(errorMessage);
            }
        }
        else {
            await this.setUnavailable("Tigo API connection not initialized");
        }
    }
}
module.exports = TigoDevice;
//# sourceMappingURL=device.js.map