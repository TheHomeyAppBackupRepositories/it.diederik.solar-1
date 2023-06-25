"use strict";
// Copyright 2019: Rob, https://github.com/pro-sumer
// License: GNU GPLv3, https://www.gnu.org/licenses/gpl.txt
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fetch = require("node-fetch");
const crypto_1 = __importDefault(require("crypto"));
class GrowattApi {
    constructor(username, password) {
        this.plants = [];
        this.cookies = null;
        this.baseUrl = "https://server-api.growatt.com";
        this.loginUrl = `${this.baseUrl}/newTwoLoginAPI.do`;
        this.plantUrl = `${this.baseUrl}/newTwoPlantAPI.do`;
        this.username = username;
        this.password = crypto_1.default
            .createHash("md5")
            .update(password)
            .digest("hex")
            .replace(/(.{2})/g, "_$1")
            .replace(/_0(.)/g, "_c$1")
            .replace(/_/g, "");
    }
    async fetchApiEndpoint(url, method = "GET", body, error) {
        const response = await fetch(url, {
            method,
            headers: {
                "User-Agent": "ShinePhone/7.1.0 (iPhone; iOS 16.1.1; Scale/3.00)",
                ...(body !== undefined
                    ? { "Content-Type": "application/x-www-form-urlencoded" }
                    : {}),
                ...(this.cookies ? { Cookie: this.cookies } : {}),
            },
            body,
        });
        // TODO: handle additional errors
        if (!response.ok) {
            throw new Error(error);
        }
        // TODO: grab cookies
        this.cookies = response.headers
            .raw()["set-cookie"].map((d) => d.split(";")[0])
            .join(";");
        return response.json();
    }
    async login() {
        this.cookies = null;
        const error = "Could not login to Growatt server";
        const loginData = await this.fetchApiEndpoint(this.loginUrl, "POST", `userName=${this.username}&password=${this.password}`, error);
        if (loginData.back.success) {
            this.plants = loginData.back.data;
        }
        else {
            throw new Error(error);
        }
    }
    async getDeviceList(plantId) {
        const error = `Could not get device list for plant ${plantId} from Growatt server`;
        const plantData = await this.fetchApiEndpoint(`${this.plantUrl}?op=getAllDeviceList&plantId=${plantId}`, "GET", undefined, error);
        return plantData.deviceList;
    }
    async getInverterSerialNumbers() {
        await this.login();
        let serialNumbers = [];
        for (let plant of this.plants) {
            const deviceList = await this.getDeviceList(plant.plantId);
            const inverters = deviceList.filter((device) => ["inverter", "tlx"].includes(device.deviceType));
            serialNumbers.push(...inverters.map((device) => device.deviceSn));
        }
        return serialNumbers;
    }
    async getInverterProductionData(serialNumber) {
        await this.login();
        for (let plant of this.plants) {
            const deviceList = await this.getDeviceList(plant.plantId);
            const device = deviceList.find((device) => device.deviceSn === serialNumber);
            if (device) {
                return {
                    currentPower: Number(device.power),
                    energyToday: Number(device.eToday),
                };
            }
        }
        return null;
    }
}
exports.default = GrowattApi;
//# sourceMappingURL=api.js.map