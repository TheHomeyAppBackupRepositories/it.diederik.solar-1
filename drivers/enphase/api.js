"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fetch = require("node-fetch");
class EnphaseEnlightenApi {
    constructor(userId, apiKey, systemId) {
        this.baseUrl = "https://api.enphaseenergy.com/api/v2";
        this.getSystems = async () => {
            const systemsUrl = `${this.baseUrl}/systems?key=${this.apiKey}&user_id=${this.userId}`;
            return this.fetchApiEndpoint(systemsUrl);
        };
        this.getStats = async () => {
            const statsUrl = `${this.baseUrl}/systems/${this.systemId}/stats?key=${this.apiKey}&user_id=${this.userId}&datetime_format=iso8601`;
            return this.fetchApiEndpoint(statsUrl);
        };
        this.userId = userId;
        this.apiKey = apiKey;
        this.systemId = systemId;
    }
    async fetchApiEndpoint(url) {
        const response = await fetch(url);
        // Handle possible errors
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("User ID or API key are incorrect, please check your settings.");
            }
            else if (response.status === 409) {
                throw new Error("API key usage limit has been exceeded. Try to increase the interval in the device settings.");
            }
            else if (response.status === 503) {
                throw new Error("Too many concurrent requests made. Are you using other apps with the Enlighten API?");
            }
            else {
                throw new Error("An unknown error occurred while fetching inverter data.");
            }
        }
        return response.json();
    }
}
exports.default = EnphaseEnlightenApi;
//# sourceMappingURL=api.js.map