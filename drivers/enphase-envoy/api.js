"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fetch = require("node-fetch");
const node_http_1 = __importDefault(require("node:http"));
const node_https_1 = __importDefault(require("node:https"));
class EnphaseEnvoyApi {
    constructor(address) {
        this.address = address;
    }
    async fetchApiEndpoint(url) {
        const response = await fetch(url, {
            // Allow self-signed SSL (newer Envoy firmware seems to use HTTPS)
            agent: (parsedUrl) => {
                if (parsedUrl.protocol == "http:") {
                    return new node_http_1.default.Agent();
                }
                else {
                    return new node_https_1.default.Agent({
                        rejectUnauthorized: false,
                    });
                }
            },
        });
        // TODO: handle additional errors
        if (!response.ok) {
            throw new Error("An unknown error occurred while fetching inverter data.");
        }
        return response.json();
    }
    async getProductionData() {
        return this.fetchApiEndpoint(`http://${this.address}/production.json?details=1`);
    }
    // Get software version to detect upgrade to Envoy v7
    // If this is the case, we direct users to remove and re-add their device
    async getEnvoySoftwareVersion() {
        const response = await fetch(`http://${this.address}/info.xml`, {
            // Allow self-signed SSL (newer Envoy firmware seems to use HTTPS)
            agent: (parsedUrl) => {
                if (parsedUrl.protocol == "http:") {
                    return new node_http_1.default.Agent();
                }
                else {
                    return new node_https_1.default.Agent({
                        rejectUnauthorized: false,
                    });
                }
            },
        });
        const envoyInfo = response.text();
        let regex = /<software>(.*?)<\/software>/;
        let match = envoyInfo.match(regex);
        let softwareVersion = match ? match[1] : null;
        return softwareVersion;
    }
}
exports.default = EnphaseEnvoyApi;
