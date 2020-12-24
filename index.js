
const axios = require('axios');

// eventual url
// const url = 'https://api.thegraph.com/subgraphs/name/jacobrosenthal/dark-forest-v04';
// Pending version may or may not be ok data
const url = "https://api.thegraph.com/subgraphs/id/QmWr9dERgF2WvXxgzRbc9owgB3YJE3Q8VCsGTwyHFv7jyx";

const query = `
query allplanets($lastID: String!) {
    planets(block: {number: 12491275}, first: 1000, where: { id_gt: $lastID  }) {
        locationId: id
        owner{ id }
        energy: populationLazy
        energyCap: populationCap
        energyGrowth: populationGrowth
        silver: silverLazy
        silverCap
        silverGrowth
        lastUpdated
        rangeUpgrades
        speedUpgrades
        defenseUpgrades
      }
    _meta{
        hasIndexingErrors
        block{
          number
          hash
        }
    }
}
`;

const getAllPlanets = async () => {

    let planets = [];
    let lastID = "";
    while (true) {

        const body = {
            query,
            variables: {
                lastID
            }
        };

        const result = await axios.post(url, JSON.stringify(body));

        // todo if hasIndexingErrors is true might want to not use that data until it shakes out, or notify someone or something
        if (result && result.data && result.data.data && result.data.data.planets) {

            if (result.data.data._meta.hasIndexingErrors) {
                throw 'graph not synced';
            }

            planets = [...planets, ...result.data.data.planets];
            if (result.data.data.planets < 1000) { return planets; }

        } else {
            console.log(result.data)
            // is reason working?
            let reason = "";
            if (result && result.data && result.data.errors) {
                reason = result.data.errors;
            }
            throw 'query problem' + '';
        }

        // todo I dont know what the limit is
        await new Promise(resolve => setTimeout(resolve, 1000));
        lastID = planets[planets.length - 1].locationId;
    }

}

const main = async () => {
    var fs = require('fs');
    let planets = await getAllPlanets();
    fs.writeFileSync("planets.json", JSON.stringify(planets))
}

main()