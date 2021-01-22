//! Paged query to download all artifacts and write to a json file. Takes a few
//! minutes sadly.

const fs = require('fs');
const axios = require('axios');

const GRAPH_URL = "https://api.thegraph.com/subgraphs/name/jacobrosenthal/dark-forest-v05";

const query = `
query allartifacts($lastID: Int!) {
    artifacts( where: { mintedAtTimestamp_gt: $lastID }, first: 1000, orderBy:mintedAtTimestamp, orderDirection:asc) {
        id
        rarity
        planetLevel
        mintedAtTimestamp
        discoverer {
          id
        }
        planetDiscoveredOn{
            id
            planetLevel
        }
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

const getAllArtifacts = async () => {

    let artifacts = [];
    let lastID = 0;
    while (true) {

        const body = {
            query,
            variables: {
                lastID
            }
        };

        const result = await axios.post(GRAPH_URL, JSON.stringify(body));

        // todo if hasIndexingErrors is true might want to not use that data until it shakes out, or notify someone or something
        if (result && result.data && result.data.data && result.data.data.artifacts) {

            if (result.data.data._meta.hasIndexingErrors) {
                throw 'graph not synced';
            }

            artifacts = [...artifacts, ...result.data.data.artifacts];
            if (result.data.data.artifacts < 1000) { return artifacts; }

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
        await new Promise(resolve => setTimeout(resolve, 100));
        lastID = artifacts[artifacts.length - 1].mintedAtTimestamp;
    }

}

const main = async () => {
    let artifacts = await getAllArtifacts();
    fs.writeFileSync("artifacts.json", JSON.stringify(artifacts))
}

main()