//! Note you can't have boolean where queries so this query maxes out getting
//! the first 1000 legendary artifacts without any paging. Currently theres only
//! ~100 legendaries currently so still ok

const axios = require('axios');

const GRAPH_URL = "https://api.thegraph.com/subgraphs/name/jacobrosenthal/dark-forest-v05";
const TWITTER_URL = "https://zkga.me/twitter/all-twitters";

const query = `
query allartifacts {
    artifacts( first: 1000, where: {rarity: LEGENDARY}) {
        id
        discoverer {
          id
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

    const result = await axios.post(GRAPH_URL, JSON.stringify({
        query,
    }));

    // todo if hasIndexingErrors is true might want to not use that data until it shakes out, or notify someone or something
    if (result && result.data && result.data.data && result.data.data.artifacts) {

        if (result.data.data._meta.hasIndexingErrors) {
            throw 'graph not synced';
        }

        return result.data.data.artifacts;

    } else {
        console.log(result.data)
        // is reason working?
        let reason = "";
        if (result && result.data && result.data.errors) {
            reason = result.data.errors;
        }
        throw 'query problem' + '';
    }

}

const main = async () => {
    const twitters = await axios.get(TWITTER_URL);
    const artifacts = await getAllArtifacts();
    const artifact_owners = new Map();
    const artifact_counts = [];

    artifacts
        .forEach(a => {

            let old = artifact_owners.get(a.discoverer.id);
            let values = [];
            if (old !== undefined) {
                values = old;
            }
            values.push(a);
            artifact_owners.set(a.discoverer.id, values)
        });

    for (owner of artifact_owners.keys()) {

        let amount = artifact_owners.get(owner).length;

        let twitter = twitters.data[owner];
        if (twitter !== undefined) {
            owner = twitter;
        }

        let item = {
            owner,
            amount,
        };

        artifact_counts.push(item);
    }

    const scoreboard = artifact_counts.sort((a, b) => b.amount - a.amount).slice(0, 10);

    console.log(artifacts.length + " Artifacts found");
    console.log(scoreboard);
}

main()