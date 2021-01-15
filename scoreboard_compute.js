//! Load a previously downloaded json file of planets, transform it to the
//! upstream format to run df functions against it, fast forwarding all planets
//! to current time, and calculating the v05 scoreboard.

const fs = require('fs');
const axios = require('axios');

const contractPrecision = 1000;
const main = async () => {

    let rawdata = fs.readFileSync("planets.json");
    let owners = new Map();

    JSON.parse(rawdata)
        .filter(p => p.owner.id !== "0x0000000000000000000000000000000000000000")
        // transform data to match javascript format
        .map(p => {

            p.locationId = p.id;

            p.energyCap = p.milliEnergyCap / contractPrecision;
            p.energyGrowth = p.milliEnergyGrowth / contractPrecision;

            p.silverCap = p.milliSilverCap / contractPrecision;
            p.silverGrowth = p.milliSilverGrowth / contractPrecision;

            p.energy = p.milliEnergyLazy / contractPrecision;
            p.silver = p.milliSilverLazy / contractPrecision;

            p.silverSpent = p.milliSilverSpent / contractPrecision;

            // df doesnt have 0x on owner fields
            p.owner = p.owner.id.substring(2, p.owner.id);

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

    var scoreboard = [];

    for (owner of owners.keys()) {

        let sorted = owners.get(owner).sort((a, b) => b.energyCap - a.energyCap);
        let ten = sorted.slice(0, 10).reduce((acc, p) => acc + p.energyCap, 0);
        let spent = sorted.reduce((acc, p) => {
            return acc + p.silverSpent + p.silver;
        }, 0) * .3;

        let five = sorted.slice(0, 5).map(p => p.locationId);

        let item = {
            player: '0x' + owner,
            score: ten + spent,
            top5Planets: five
        };

        scoreboard.push(item);
    }

    var scoreboard = scoreboard.sort((a, b) => b.score - a.score);

    // well have to get _meta.block.number from index.js for something like timestamp
    console.log(JSON.stringify({ scoreboard }));
}


main()


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
