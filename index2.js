const fs = require('fs');
const axios = require('axios');

const url = "https://zkga.me/twitter/all-twitters";

const contractPrecision = 1000;
const main = async () => {

    let rawdata = fs.readFileSync("planets.json");
    let owners = new Map();

    JSON.parse(rawdata)
        .filter(p => p.owner.id !== "0x0000000000000000000000000000000000000000")
        .map(p => {

            // all the ported js function act on ms
            p.energyCap = p.energyCap / contractPrecision;
            p.energyGrowth = p.energyGrowth / contractPrecision;

            p.silverCap = p.silverCap / contractPrecision;
            p.silverGrowth = p.silverGrowth / contractPrecision;

            p.energy = p.energy / contractPrecision;
            p.silver = p.silver / contractPrecision;

            // df doesnt have 0x on owner fields
            p.owner = p.owner.id.substring(2, p.owner.id);

            p.upgradeState = [
                p.rangeUpgrades,
                p.speedUpgrades,
                p.defenseUpgrades,
            ];

            p.silverSpent = calculateSilverSpent(p);

            return p;

        })
        .map(p => updatePlanetToTime(p, Date.now()))
        .forEach(p => {

            let old = owners.get(p.owner);
            let values = [];
            if (old !== undefined) {
                values = old;
            }
            values.push(p);
            owners.set(p.owner, values)
        });

    let leaderboard = [];


    const result = await axios.get(url);

    for (owner of owners.keys()) {

        let sorted = owners.get(owner).sort((a, b) => b.energyCap - a.energyCap);
        let ten = sorted.slice(0, 10).reduce((acc, p) => acc + p.energyCap, 0);
        let spent = sorted.reduce((acc, p) => {
            return acc + p.silverSpent + p.silver;
        }, 0) / 10;


        let twitter = result.data['0x' + owner];
        if (twitter === undefined) {
            twitter = "";
        }

        leaderboard.push([owner, ten + spent, twitter]);
    }

    let topten = leaderboard.sort((a, b) => b[1] - a[1]).slice(0, 10);
    console.log(topten)
}


main()



function calculateSilverSpent(planet) {
    const upgradeCosts = [20, 40, 60, 80, 100];
    let totalUpgrades = 0;
    for (let i = 0; i < planet.upgradeState.length; i++) {
        totalUpgrades += planet.upgradeState[i];
    }
    let totalUpgradeCostPercent = 0;
    for (let i = 0; i < totalUpgrades; i++) {
        totalUpgradeCostPercent += upgradeCosts[i];
    }
    return (totalUpgradeCostPercent / 100) * planet.silverCap;
}

function hasOwner(planet) {
    return planet.owner !== "0000000000000000000000000000000000000000";
};

function getSilverOverTime(
    planet,
    startTimeMillis,
    endTimeMillis
) {
    if (!hasOwner(planet)) {
        return planet.silver;
    }

    if (planet.silver > planet.silverCap) {
        return planet.silverCap;
    }
    const timeElapsed = endTimeMillis / 1000 - startTimeMillis / 1000;

    return Math.min(
        timeElapsed * planet.silverGrowth + planet.silver,
        planet.silverCap
    );
}

function getEnergyAtTime(planet, atTimeMillis) {
    if (planet.energy === 0) {
        return 0;
    }
    if (!hasOwner(planet)) {
        return planet.energy;
    }
    const timeElapsed = atTimeMillis / 1000 - planet.lastUpdated;
    const denominator =
        Math.exp((-4 * planet.energyGrowth * timeElapsed) / planet.energyCap) *
        (planet.energyCap / planet.energy - 1) +
        1;
    return planet.energyCap / denominator;
}

// altered to remove endtimeseconds and return planet
function updatePlanetToTime(planet, atTimeMillis) {
    planet.silver = getSilverOverTime(
        planet,
        planet.lastUpdated * 1000,
        atTimeMillis
    );
    planet.energy = getEnergyAtTime(planet, atTimeMillis);
    planet.lastUpdated = atTimeMillis / 1000;
    return planet;
}
