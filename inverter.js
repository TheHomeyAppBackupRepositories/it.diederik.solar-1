"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inverter = void 0;
const homey_1 = require("homey");
class Inverter extends homey_1.Device {
    setInterval(interval) {
        this.currentInterval = this.homey.setInterval(this.checkProduction.bind(this), interval * 60000);
    }
    resetInterval(newInterval) {
        this.homey.clearInterval(this.currentInterval);
        this.setInterval(newInterval);
    }
    async onInit() {
        if (!this.interval) {
            throw new Error("Expected interval to be set");
        }
        this.setInterval(this.interval);
        // SDK v3 migration, remove cron listeners
        this.removeAllListeners();
        // Force immediate production check
        this.checkProduction();
    }
    checkProduction() {
        throw new Error("Expected override");
    }
}
exports.Inverter = Inverter;
