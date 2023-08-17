"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inverter_1 = require("../../inverter");
const api_1 = __importDefault(require("./api"));
const NET_CONSUMPTION_METER = "net-consumption";
const PRODUCTION_METER = "production";
class EnphaseEnvoy extends inverter_1.Inverter {
    constructor() {
        super(...arguments);
        this.interval = 1;
    }
    async onInit() {
        // Add capabilities if missing
        if (!this.hasCapability("measure_power.consumption") ||
            !this.hasCapability("measure_power.grid")) {
            this.addCapability("measure_power.consumption");
            this.addCapability("measure_power.grid");
        }
        super.onInit();
    }
    onDiscoveryResult(discoveryResult) {
        // Return a truthy value here if the discovery result matches your device.
        return discoveryResult.id === this.getData().id;
    }
    async onDiscoveryAvailable(discoveryResult) {
        // This method will be executed once when the device has been found (onDiscoveryResult returned true)
        const { username, password } = this.getSettings();
        this.enphaseApi = new api_1.default(`${discoveryResult.address}`, this.getData().id, username, password);
        await this.enphaseApi.getProductionData(); // When this throws, the device will become unavailable.
    }
    onDiscoveryAddressChanged(discoveryResult) {
        // Update your connection details here, reconnect when the device is offline
        const { username, password } = this.getSettings();
        this.enphaseApi = new api_1.default(`${discoveryResult.address}`, this.getData().id, username, password);
    }
    async onDiscoveryLastSeenChanged() {
        // When the device is offline, try to reconnect here
        await this.setAvailable();
    }
    async onSettings({ newSettings }) {
        // TODO: fix typing once Athom fixes their TypeScript implementation
        const typedNewSettings = newSettings;
        await api_1.default.getEnphaseSessionId(typedNewSettings.username, typedNewSettings.password);
        this.enphaseApi?.setCredentials(typedNewSettings.username, typedNewSettings.password);
        await this.setAvailable();
    }
    async checkProduction() {
        this.log("Checking production");
        if (this.enphaseApi) {
            try {
                // Determine whether Envoy is metered
                // If it is, use meter data, otherwise get production data from inverter reports
                const meterData = await this.enphaseApi.getMeters();
                const isMetered = meterData.length &&
                    meterData
                        .map((meter) => meter.measurementType)
                        .every((measurementType) => [NET_CONSUMPTION_METER, PRODUCTION_METER].includes(measurementType));
                // Get production data from inverter reports
                const productionData = await this.enphaseApi.getProductionData();
                const currentEnergy = productionData.wattHoursToday / 1000;
                await this.setCapabilityValue("meter_power", currentEnergy);
                this.log(`Current production energy is ${currentEnergy}kWh`);
                if (!isMetered) {
                    const currentPower = productionData.wattsNow;
                    await this.setCapabilityValue("measure_power", currentPower);
                    this.log(`Current production power is ${currentPower}W`);
                }
                if (isMetered) {
                    // Get production, consumption and net import data from meters
                    const meterReadingsData = await this.enphaseApi.getMeterReadings();
                    const productionPower = meterReadingsData.find((meter) => meter.eid ===
                        meterData.find((meter) => meter.measurementType === PRODUCTION_METER)?.eid)?.activePower || null;
                    const gridConsumptionPower = meterReadingsData.find((meter) => meter.eid ===
                        meterData.find((meter) => meter.measurementType === NET_CONSUMPTION_METER)?.eid)?.activePower || null;
                    if (productionPower !== null && gridConsumptionPower !== null) {
                        const selfConsumption = productionPower + gridConsumptionPower;
                        await this.setCapabilityValue("measure_power", productionPower);
                        this.log(`Current production power is ${productionPower}W`);
                        await this.setCapabilityValue("measure_power.consumption", selfConsumption);
                        await this.setCapabilityValue("measure_power.grid", gridConsumptionPower);
                    }
                    else {
                        this.log("Envoy is metered but could not fetch either net-consumption or production values from meters");
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
            await this.setUnavailable("Enphase Envoy could not be discovered on your network");
        }
    }
}
module.exports = EnphaseEnvoy;
