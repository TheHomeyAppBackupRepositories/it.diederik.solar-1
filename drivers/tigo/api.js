"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fetch = require("node-fetch");
class TigoApi {
    constructor(username, password, systemId) {
        this.baseUrl = "https://api2.tigoenergy.com/api/v3";
        this.getSummary = async () => {
            return this.fetchApiEndpoint(`data/summary?system_id=${this.systemId}`);
        };
        this.getSystems = async () => {
            return this.fetchApiEndpoint("systems");
        };
        this.username = username;
        this.password = password;
        this.systemId = systemId;
    }
    async fetchApiEndpoint(endpoint) {
        const authorizationHeader = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`;
        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
            headers: {
                Authorization: authorizationHeader,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        // Handle possible errors
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Your Tigo credentials are incorrect, please try again.");
            }
            else {
                throw new Error("An unknown error occurred while fetching inverter data.");
            }
        }
        return response.json();
    }
}
exports.default = TigoApi;
//# sourceMappingURL=api.js.map