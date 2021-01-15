//! Paged query to download all arrivals at v05 game end and write to a json
//! file. Takes a few minutes sadly.

const axios = require('axios');

const GRAPH_URL = "https://api.thegraph.com/subgraphs/name/jacobrosenthal/dark-forest-v05";
const TWITTER_URL = "https://zkga.me/twitter/all-twitters";

const contractPrecision = 1000;

const query = `
query allarrivals($lastID: String!) {
    arrivals( first: 1000, where: { id_gt: $lastID }) {
        id
        milliSilverMoved
        arrivalTime
        departureTime
        fromPlanet{
            id
            speed
        }
        player{
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

const getAllArrivals = async () => {

    let arrivals = [];
    let lastID = "";
    while (true) {

        const body = {
            query,
            variables: {
                lastID
            }
        };

        const result = await axios.post(GRAPH_URL, JSON.stringify(body));

        // todo if hasIndexingErrors is true might want to not use that data until it shakes out, or notify someone or something
        if (result && result.data && result.data.data && result.data.data.arrivals) {

            if (result.data.data._meta.hasIndexingErrors) {
                throw 'graph not synced';
            }

            arrivals = [...arrivals, ...result.data.data.arrivals];

            console.log(result.data.data.arrivals.length);

            if (result.data.data.arrivals < 1000) { return arrivals; }

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
        lastID = arrivals[arrivals.length - 1].id;
    }

}

const main = async () => {
    const arrivals = await getAllArrivals();
    const twitters = await axios.get(TWITTER_URL);

    const scoreboard = arrivals.map(a => {
        // all the ported js function act on ms
        a.silverMoved = a.milliSilverMoved / contractPrecision;

        // distance = time / speed
        a.distance = (a.arrivalTime - a.departureTime)
            / (a.fromPlanet.speed / 100);

        a.twitter = twitters.data[a.player.id]

        return a;
    });

    const whale = scoreboard.sort((a, b) => b.silverMoved - a.silverMoved).slice(0, 1);
    console.log(whale);

    const long_distance_runners = scoreboard.sort((a, b) => b.distance - a.distance).slice(0, 10);
    console.log(long_distance_runners);
}

main()