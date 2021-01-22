//! Load a previously downloaded json file of artifacts, and inspect a users
//! artifact history

const fs = require('fs');

const main = async () => {

    let rawdata = fs.readFileSync("artifacts.json");

    let artifacts = JSON.parse(rawdata)
        .filter(a => a.discoverer.id === "0x8658fdfdaf9ecd2cea6c59216a94cbdee2881327");

    let legendaries = artifacts.filter(a => a.rarity === "LEGENDARY");
    console.log(legendaries);
    console.log('---------------')
    console.log('minted total ' + artifacts.length);
    console.log('COMMON ' + artifacts.filter(a => a.rarity === "COMMON").length);
    console.log('RARE ' + artifacts.filter(a => a.rarity === "RARE").length);
    console.log('EPIC ' + artifacts.filter(a => a.rarity === "EPIC").length);
    console.log('LEGENDARY ' + legendaries.length);
    console.log('---------------')
    var recent = artifacts.filter(a => a.mintedAtTimestamp > (Date.now() / 1000) - (1 * 24 * 60 * 60));
    console.log('minted in last 24 hours ' + recent.length);
    console.log('COMMON ' + recent.filter(a => a.rarity === "COMMON").length);
    console.log('RARE ' + recent.filter(a => a.rarity === "RARE").length);
    console.log('EPIC ' + recent.filter(a => a.rarity === "EPIC").length);
    console.log('LEGENDARY ' + recent.filter(a => a.rarity === "LEGENDARY").length);
    console.log('---------------')
    console.log('distribution discovered on');
    console.log('LVL3 ' + artifacts.filter(a => a.planetDiscoveredOn.planetLevel === 3).length);
    console.log('LVL4 ' + artifacts.filter(a => a.planetDiscoveredOn.planetLevel === 4).length);
    console.log('LVL5 ' + artifacts.filter(a => a.planetDiscoveredOn.planetLevel === 5).length);
    console.log('LVL6 ' + artifacts.filter(a => a.planetDiscoveredOn.planetLevel === 6).length);
    console.log('LVL7 ' + artifacts.filter(a => a.planetDiscoveredOn.planetLevel === 7).length);
}


main()

