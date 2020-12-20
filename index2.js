const fs = require('fs');
const df = require('../darkforest/something');

const main = async () => {

    let rawdata = fs.readFileSync("planets.json");
    let players = new Map();

    JSON.parse(rawdata)
        // remove the system player
        .filter(p => p.owner.id !== "0x0000000000000000000000000000000000000000")
        // massage the data into just enough of a df looking object
        .map(p => {

            // df functions still calls it energy, and doesnt use 'lazy'
            p.energy = p.populationLazy;
            p.silver = p.silverLazy;
            p.energyCap = p.populationCap;
            p.energyGrowth = p.populationGrowth

            // df doesnt have 0x on owner fields
            p.owner = p.owner.id.substring(2, p.owner.id);

            // p.id is 0 padded, no 0x prefix, so same as LocationId?
            p.locationId = p.id;

        })
        // update the lazy population and silver to current time
        .map(p => df.updatePlanetToTime(p, Date.now()))
        // build a hashmap of array of planets for each owner
        .forEach(p => {

            let old = players.get(p.owner.id);
            let values = [];
            if (old !== undefined) {
                values = old;
            }
            values.push(p);
            players.set(p.owner.id, values)
        });

    // todo calculate its silverspent on js side to check

    let leaderboard = [];

    // for each players, 10% of their total spent and unspent silver, + their top 10 energyCap
    for (player of players.keys()) {

        let sorted = players.get(player).sort((a, b) => b.energyCap - a.energyCap);
        let ten = sorted.slice(0, 10).reduce((acc, p) => acc + p.energyCap, 0);
        let spent = sorted.reduce((acc, p) => acc + p.silverSpentComputed + p.silver, 0) / 10;

        leaderboard.push([player, ten + spent]);
    }

    // sort scores and print the top 10
    let topten = leaderboard.sort((a, b) => b[1] - a[1]).slice(0, 10);
    console.log(topten)
}


main()