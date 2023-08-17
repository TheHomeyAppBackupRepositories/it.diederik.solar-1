"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const node_http_1 = __importDefault(require("node:http"));
const node_https_1 = __importDefault(require("node:https"));
const node_url_1 = require("node:url");
class EnphaseEnvoyApi {
    constructor(address, deviceSn, username, password) {
        this.accessToken = null;
        this.address = address;
        this.deviceSn = deviceSn;
        this.username = username;
        this.password = password;
    }
    setCredentials(username, password) {
        this.username = username;
        this.password = password;
    }
    async fetchApiEndpoint(path, isRetry = false) {
        if (this.address === null) {
            throw new Error("Attempted to fetch data for an uninitialised Enphase device");
        }
        const url = `https://${this.address}/${path}`;
        const requestHeaders = this.accessToken !== null
            ? { Authorization: `Bearer ${this.accessToken}` }
            : undefined;
        const response = await (0, node_fetch_1.default)(url, {
            headers: requestHeaders,
            // Allow self-signed SSL (Envoy v7 uses self-signed certificate on HTTPS)
            // Keep backwards compatibility to warn users that v5 is not supported anymore
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
        if (response.status >= 400 && response.status < 500 && !isRetry) {
            // Unauthorized, token might be expired - request token and retry (once)
            await this.getAccessToken();
            return this.fetchApiEndpoint(path, true);
        }
        else if (!response.ok) {
            throw new Error("An unknown error occurred while fetching inverter data");
        }
        return response;
    }
    static async getEnphaseSessionId(username, password) {
        const formData = new node_url_1.URLSearchParams();
        formData.append("user[email]", username);
        formData.append("user[password]", password);
        const authResponse = await (0, node_fetch_1.default)("https://enlighten.enphaseenergy.com/login/login.json", { method: "POST", body: formData });
        if (!authResponse.ok) {
            throw new Error("Failed to authenticate to Enphase - are your username and password correct?");
        }
        const parsedAuthResponse = await authResponse.json();
        return parsedAuthResponse.session_id;
    }
    async getAccessToken() {
        const sessionId = await EnphaseEnvoyApi.getEnphaseSessionId(this.username, this.password);
        const tokenResponse = await (0, node_fetch_1.default)("https://entrez.enphaseenergy.com/tokens", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: sessionId,
                serial_num: this.deviceSn,
                username: this.username,
            }),
        });
        if (tokenResponse.ok) {
            this.accessToken = await tokenResponse.text();
        }
        else {
            throw new Error("An error occurred while retrieving an access token");
        }
    }
    async getProductionData() {
        return (await this.fetchApiEndpoint("api/v1/production")).json();
    }
    async getMeters() {
        return (await this.fetchApiEndpoint("ivp/meters")).json();
    }
    async getMeterReadings() {
        return (await this.fetchApiEndpoint("ivp/meters/readings")).json();
    }
}
exports.default = EnphaseEnvoyApi;
