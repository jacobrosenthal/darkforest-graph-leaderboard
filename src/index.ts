const fs = require('fs');

const main = async () => {

    let now = Date.now();

    let rawdata = fs.readFileSync("planets.json");
    let owners = new Map();

    JSON.parse(rawdata)
        .filter(p => p.owner.id !== "0x0000000000000000000000000000000000000000")
        .map(p => {

            // js still calls it energy, and doesnt use 'lazy'
            p.energy = p.populationLazy;
            p.silver = p.silverLazy;
            p.energyCap = p.populationCap;
            p.energyGrowth = p.populationGrowth

            // js stores in ms
            p.lastUpdated = p.lastUpdated * 1000;

            // remove 0x on owner
            p.owner.id = p.owner.id.substring(2, p.owner.id);

        }).map(p => updatePlanetToTime(p, now)).forEach(p => {

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

        let sorted = owners.get(owner).sort((a, b) => b.energyCap - a.energyCap);
        let ten = sorted.slice(0, 10).reduce((acc, p) => acc + p.energyCap, 0);
        let spent = sorted.reduce((acc, p) => acc + p.silverSpentComputed + p.silver, 0) / 10;

        leaderboard.push([owner, ten + spent]);
    }

    let topten = leaderboard.sort((a, b) => b[1] - a[1]).slice(0, 10);
    console.log(topten)
}


main()