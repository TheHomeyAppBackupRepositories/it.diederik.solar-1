"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inverter_1 = require("../../inverter");
const api_1 = __importDefault(require("./api"));
class PvOutputDevice extends inverter_1.Inverter {
    constructor() {
        super(...arguments);
        this.interval = this.getSetting("interval");
    }
    async onInit() {
        const data = this.getData();
        const settings = this.getSettings();
        this.api = new api_1.default(data.sid, settings.key);
        super.onInit();
    }
    async onSettings({ newSettings, changedKeys, }) {
        // TODO: fix typing once Athom fixes their TypeScript implementation
        const typedNewSettings = newSettings;
        if (changedKeys.includes("key")) {
            const data = this.getData();
            const newApi = new api_1.default(data.sid, typedNewSettings.key);
            await newApi.getSystemName();
            this.api = newApi;
            // Force production check when API key is changed
            this.checkProduction();
        }
        if (changedKeys.includes("interval") && typedNewSettings.interval) {
            this.resetInterval(typedNewSettings.interval);
            this.homey.log(`Changed interval to ${typedNewSettings.interval}`);
        }
        if (changedKeys.includes("useExtendedFields")) {
            if (!typedNewSettings.useExtendedFields) {
                // Remove extended capabilities
                this.removeCapability("battery_soc");
            }
        }
    }
    async checkProduction() {
        this.homey.log("Checking production");
        const settings = this.getSettings();
        if (this.api) {
            try {
                // Production values
                const statusData = await this.api.getStatusData(settings.useExtendedFields);
                // Production power
                if (!isNaN(statusData.currentProductionPower)) {
                    await this.setCapabilityValue("measure_power", statusData.currentProductionPower);
                    this.homey.log(`Current production power is ${statusData.currentProductionPower}W`);
                }
                // Daily production energy
                if (!isNaN(statusData.dailyProductionEnergy)) {
                    await this.setCapabilityValue("meter_power", statusData.dailyProductionEnergy);
                    this.homey.log(`Current production energy is ${statusData.dailyProductionEnergy}kWh`);
                }
                // Consumption power
                if (!isNaN(statusData.currentConsumptionPower)) {
                    if (!this.hasCapability("measure_power.consumption")) {
                        this.addCapability("measure_power.consumption");
                    }
                    await this.setCapabilityValue("measure_power.consumption", statusData.currentConsumptionPower);
                    this.homey.log(`Current consumption power is ${statusData.currentConsumptionPower}W`);
                }
                // Daily consumption energy
                if (!isNaN(statusData.dailyConsumptionEnergy)) {
                    if (!this.hasCapability("meter_power.consumption")) {
                        this.addCapability("meter_power.consumption");
                    }
                    await this.setCapabilityValue("meter_power.consumption", statusData.dailyConsumptionEnergy);
                    this.homey.log(`Current consumption energy is ${statusData.dailyConsumptionEnergy}kWh`);
                }
                // Temperature and voltage values
                if (!isNaN(statusData.currentVoltage)) {
                    if (!this.hasCapability("measure_voltage")) {
                        await this.addCapability("measure_voltage");
                    }
                    await this.setCapabilityValue("measure_voltage", statusData.currentVoltage);
                    this.homey.log(`Current voltage is ${statusData.currentVoltage}V`);
                }
                if (!isNaN(statusData.currentTemperature)) {
                    if (!this.hasCapability("measure_temperature")) {
                        await this.addCapability("measure_temperature");
                    }
                    await this.setCapabilityValue("measure_temperature", statusData.currentTemperature);
                    this.homey.log(`Current temperature is ${statusData.currentTemperature} degrees Celsius`);
                }
                // Handle extended fields
                if (settings.useExtendedFields) {
                    // Battery percentage
                    if (settings.batteryPercentageField &&
                        settings.batteryPercentageField !== "-1" &&
                        statusData.extendedFields) {
                        if (!this.hasCapability("battery_soc")) {
                            await this.addCapability("battery_soc");
                        }
                        const batteryPercentage = parseFloat(statusData.extendedFields[parseInt(settings.batteryPercentageField) - 7]);
                        await this.setCapabilityValue("battery_soc", batteryPercentage);
                        this.homey.log(`Current battery percentage is ${batteryPercentage}%`);
                    }
                }
                await this.setAvailable();
            }
            catch (err) {
                const errorMessage = err.message;
                this.homey.log(`Unavailable: ${errorMessage}`);
                await this.setUnavailable(errorMessage);
            }
        }
        else {
            await this.setUnavailable("PVOutput API connection not initialized");
        }
    }
}
module.exports = PvOutputDevice;
