"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inverter_1 = require("../../inverter");
const api_1 = __importDefault(require("./api"));
class EnphaseDevice extends inverter_1.Inverter {
    constructor() {
        super(...arguments);
        this.interval = this.getSetting("interval");
    }
    async onInit() {
        const data = this.getData();
        const settings = this.getSettings();
        this.api = new api_1.default(settings.uid, settings.key, data.id);
        super.onInit();
    }
    async onSettings({ newSettings, changedKeys, }) {
        // TODO: fix typing once Athom fixes their TypeScript implementation
        const typedNewSettings = newSettings;
        if (changedKeys.includes("key") || changedKeys.includes("uid")) {
            const data = this.getData();
            const newApi = new api_1.default(typedNewSettings.uid, typedNewSettings.key, data.id);
            await newApi.getStats();
            this.api = newApi;
            // Force production check when API key is changed
            this.checkProduction();
        }
        if (changedKeys.includes("interval") && typedNewSettings.interval) {
            this.resetInterval(typedNewSettings.interval);
            this.homey.log(`Changed interval to ${typedNewSettings.interval}`);
        }
    }
    async checkProduction() {
        this.homey.log("Checking production");
        if (this.api) {
            try {
                const systemStats = await this.api.getStats();
                let currentEnergy = 0;
                let currentPower = 0;
                if (systemStats !== null) {
                    currentEnergy =
                        systemStats.intervals.reduce((lastValue, report) => lastValue + report.enwh, 0) / 1000;
                    currentPower =
                        systemStats.intervals[systemStats.intervals.length - 1].powr;
                }
                await this.setCapabilityValue("meter_power", currentEnergy);
                await this.setCapabilityValue("measure_power", currentPower);
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
            await this.setUnavailable("Enphase Enlighten API connection not initialized");
        }
    }
}
module.exports = EnphaseDevice;
//# sourceMappingURL=device.js.map