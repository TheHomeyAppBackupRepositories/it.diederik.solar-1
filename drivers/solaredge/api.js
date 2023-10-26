"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _importDynamic = new Function("modulePath", "return import(modulePath)");
async function fetch(...args) {
    const { default: fetch } = await _importDynamic("node-fetch");
    return fetch(...args);
}
class SolarEdgeApi {
    constructor(apiKey, siteId, serialNumber, timeZone) {
        this.baseUrl = "https://monitoringapi.solaredge.com";
        this.checkSettings = async () => {
            if (!this.apiKey || !this.siteId) {
                throw new Error("Please check your settings and try again.");
            }
            const equipmentUrl = `${this.baseUrl}/equipment/${this.siteId}/list?api_key=${this.apiKey}&format=json`;
            try {
                const equipmentListResponse = this.fetchApiEndpoint(equipmentUrl);
                if ((await equipmentListResponse).reporters.count < 1) {
                    throw new Error("No SolarEdge inverters were found in this site");
                }
            }
            catch (e) {
                // Check if equipment is available within site
            }
        };
        this.getSites = async () => {
            const sitesUrl = `${this.baseUrl}/sites/list?api_key=${this.apiKey}&format=json`;
            return this.fetchApiEndpoint(sitesUrl);
        };
        this.getPowerData = async () => {
            const currentIsoString = this.getCurrentIsoString();
            // Power values
            const startTime = this.getIsoStringFromPast(15);
            const powerDataUrl = `${this.baseUrl}/site/${this.siteId}/powerDetails?api_key=${this.apiKey}&format=json&meters=Production,Consumption&startTime=${startTime}&endTime=${currentIsoString}`;
            return this.fetchApiEndpoint(powerDataUrl);
        };
        this.getEnergyData = async () => {
            const currentDateString = this.getCurrentDateString();
            const energyDataUrl = `${this.baseUrl}/site/${this.siteId}/energyDetails?api_key=${this.apiKey}&format=json&meters=Production,Consumption&startTime=${currentDateString} 00:00:00&endTime=${currentDateString} 23:59:59`;
            return this.fetchApiEndpoint(energyDataUrl);
        };
        this.getEquipmentList = async () => {
            const equipmentUrl = `${this.baseUrl}/equipment/${this.siteId}/list?api_key=${this.apiKey}&format=json`;
            return this.fetchApiEndpoint(equipmentUrl);
        };
        this.getEquipmentData = async () => {
            const currentIsoString = this.getCurrentIsoString();
            const startTime = this.getIsoStringFromPast(15);
            const equipmentDataUrl = `${this.baseUrl}/equipment/${this.siteId}/${this.serialNumber}/data?api_key=${this.apiKey}&format=json&startTime=${startTime}&endTime=${currentIsoString}`;
            return this.fetchApiEndpoint(equipmentDataUrl);
        };
        this.siteId = siteId;
        this.apiKey = apiKey;
        this.serialNumber = serialNumber;
        this.timeZone = timeZone;
    }
    getCurrentDate() {
        // Return date in Homey timezone
        return new Date(new Date().toLocaleString("en-US", { timeZone: this.timeZone }));
    }
    getCurrentIsoString() {
        return this.getIsoString(this.getCurrentDate());
    }
    getIsoStringFromPast(minutesOffset) {
        const date = new Date(this.getCurrentDate().getTime() - minutesOffset * 60000);
        return this.getIsoString(date);
    }
    getCurrentDateString() {
        return this.getCurrentIsoString().slice(0, 10);
    }
    getIsoString(date) {
        const offsetMs = date.getTimezoneOffset() * 60 * 1000;
        const msLocal = date.getTime() - offsetMs;
        const dateLocal = new Date(msLocal);
        const iso = dateLocal.toISOString();
        return iso.slice(0, 19).replace("T", " ");
    }
    async fetchApiEndpoint(url) {
        const response = await fetch(new URL(url));
        // Handle possible errors
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error("System ID or API key are incorrect, please check your settings.");
            }
            else if (response.status === 429) {
                throw new Error("API key usage limit has been exceeded. Try to increase the interval in the device settings.");
            }
            else {
                throw new Error(`An unknown error occurred (status ${response.status}) while fetching inverter data.`);
            }
        }
        return response.json();
    }
}
exports.default = SolarEdgeApi;
