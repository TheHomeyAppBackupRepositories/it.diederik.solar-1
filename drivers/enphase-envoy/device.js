"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inverter_1 = require("../../inverter");
const api_1 = __importDefault(require("./api"));
class EnphaseEnvoy extends inverter_1.Inverter {
    constructor() {
        super(...arguments);
        this.interval = 1 / 10;
    }
    async onInit() {
        // SDK v3 migration
        if (this.hasCapability("consumption")) {
            this.removeCapability("consumption");
            this.addCapability("measure_power.consumption");
        }
        if (this.hasCapability("daily_consumption")) {
            this.removeCapability("daily_consumption");
            this.addCapability("meter_power.consumption");
        }
        super.onInit();
    }
    onDiscoveryResult(discoveryResult) {
        // Return a truthy value here if the discovery result matches your device.
        return discoveryResult.id === this.getData().id;
    }
    async onDiscoveryAvailable(discoveryResult) {
        // This method will be executed once when the device has been found (onDiscoveryResult returned true)
        this.enphaseApi = new api_1.default(`${discoveryResult.address}:${discoveryResult.port}`);
        await this.enphaseApi.getProductionData(); // When this throws, the device will become unavailable.
    }
    onDiscoveryAddressChanged(discoveryResult) {
        // Update your connection details here, reconnect when the device is offline
        this.enphaseApi = new api_1.default(`${discoveryResult.address}:${discoveryResult.port}`);
    }
    async onDiscoveryLastSeenChanged() {
        // When the device is offline, try to reconnect here
        await this.setAvailable();
    }
    async checkProduction() {
        this.log("Checking production");
        if (this.enphaseApi) {
            try {
                const productionData = await this.enphaseApi.getProductionData();
                const isMetered = productionData.production[1] &&
                    productionData.production[1].activeCount > 0;
                const hasConsumption = productionData.consumption &&
                    productionData.consumption[0].activeCount > 0;
                let currentProductionEnergy;
                let currentProductionPower;
                if (isMetered) {
                    currentProductionEnergy = productionData.production[1].whToday
                        ? productionData.production[1].whToday / 1000
                        : 0;
                    currentProductionPower = productionData.production[1].wNow;
                }
                else {
                    const enphaseEnergyMeterDate = this.getStoreValue("enphaseEnergyMeterDate");
                    if (enphaseEnergyMeterDate &&
                        enphaseEnergyMeterDate === new Date().toDateString()) {
                        currentProductionEnergy =
                            (productionData.production[0].whLifetime -
                                this.getStoreValue("enphaseEnergyMeter")) /
                                1000;
                    }
                    else {
                        this.setStoreValue("enphaseEnergyMeterDate", new Date().toDateString());
                        this.setStoreValue("enphaseEnergyMeter", productionData.production[0].whLifetime);
                        currentProductionEnergy = 0;
                    }
                    currentProductionPower = productionData.production[0].wNow;
                }
                if (currentProductionEnergy !== null) {
                    await this.setCapabilityValue("meter_power", currentProductionEnergy);
                    this.log(`Current production energy is ${currentProductionEnergy}kWh`);
                }
                await this.setCapabilityValue("measure_power", currentProductionPower);
                this.log(`Current production power is ${currentProductionPower}W`);
                if (hasConsumption) {
                    const currentConsumptionPower = productionData.consumption[0].wNow;
                    const currentConsumptionEnergy = productionData.consumption[0].whToday / 1000;
                    await this.setCapabilityValue("measure_power.consumption", currentConsumptionPower);
                    await this.setCapabilityValue("meter_power.consumption", currentConsumptionEnergy);
                    this.log(`Current consumption power is ${currentConsumptionPower}W`);
                    this.log(`Current consumption energy is ${currentConsumptionEnergy}W`);
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
