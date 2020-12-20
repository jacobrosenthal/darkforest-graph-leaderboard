const fs = require('fs');

const main = async () => {

    let now = Math.trunc(Date.now() / 1000);

    let rawdata = fs.readFileSync("planets.json");
    let owners = new Map();

    JSON.parse(rawdata).filter(p => p.owner.id !== "0x0000000000000000000000000000000000000000").map(p => updatePlanetToTime(p, now)).forEach(p => {

        let old = owners.get(p.owner.id);
        let values = [];
        if (old !== undefined) {
            values = old;
        }
        values.push(p);
        owners.set(p.owner.id, values)
    });

    // todo calculate its silverspent on js side to check

    let leaderboard = [];

    for (owner of owners.keys()) {

        let sorted = owners.get(owner).sort((a, b) => b.populationCap - a.populationCap);
        let ten = sorted.slice(0, 10).reduce((acc, p) => acc + p.populationCap, 0);
        let spent = sorted.reduce((acc, p) => acc + p.silverSpentComputed + p.silverLazy, 0) / 10;

        leaderboard.push([owner, ten + spent]);
    }

    let topten = leaderboard.sort((a, b) => b[1] - a[1]).slice(0, 10);
    console.log(topten)
}


main()



//careful ours have 0x on front
function hasOwner(planet) {
    return planet.owner !== "0x0000000000000000000000000000000000000000";
};

function getSilverOverTime(
    planet,
    startTimeMillis,
    endTimeMillis
) {
    if (!hasOwner(planet)) {
        return planet.silverLazy;
    }

    if (planet.silverLazy > planet.silverCap) {
        return planet.silverCap;
    }
    const timeElapsed = endTimeMillis - startTimeMillis;

    return Math.min(
        timeElapsed * planet.silverGrowth + planet.silverLazy,
        planet.silverCap
    );
}


function getEnergyAtTime(planet, atTimeMillis) {
    if (planet.populationLazy === 0) {
        return 0;
    }
    if (!hasOwner(planet)) {
        return planet.populationLazy;
    }
    const timeElapsed = atTimeMillis - planet.lastUpdated;
    const denominator =
        Math.exp((-4 * planet.populationGrowth * timeElapsed) / planet.populationCap) *
        (planet.populationCap / planet.populationLazy - 1) +
        1;
    return planet.populationCap / denominator;
}

//careful, altered to remove /1000 as ours is in seconds
function updatePlanetToTime(planet, atTimeS) {
    planet.silverLazy = getSilverOverTime(
        planet,
        planet.lastUpdated,
        atTimeS
    );
    planet.populationLazy = getEnergyAtTime(planet, atTimeS);
    planet.lastUpdated = atTimeS;
    return planet;
}
