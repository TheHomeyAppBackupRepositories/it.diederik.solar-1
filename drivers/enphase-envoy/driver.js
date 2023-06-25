"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = require("homey");
class EnphaseEnvoyDriver extends homey_1.Driver {
    async onPairListDevices() {
        const discoveryStrategy = this.getDiscoveryStrategy();
        const discoveryResults = discoveryStrategy.getDiscoveryResults();
        const devices = Object.values(discoveryResults).map((discoveryResult) => {
            const typedDiscoveryResult = discoveryResult;
            const txtData = typedDiscoveryResult.txt;
            return {
                name: txtData.name,
                data: {
                    id: typedDiscoveryResult.id,
                },
            };
        });
        return devices;
    }
}
module.exports = EnphaseEnvoyDriver;
//# sourceMappingURL=driver.js.map