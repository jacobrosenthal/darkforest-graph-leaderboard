//! Paged query to download all arrivals at v05 game end and write to a json
//! file. Takes a few minutes sadly.

const axios = require('axios');

// May or may not be good data
const url = "https://api.thegraph.com/subgraphs/name/jacobrosenthal/dark-forest-v05";

const query = `
query allarrivals($lastID: String!) {
    arrivals( first: 1000, where: { id_gt: $lastID  }) {
        id
        milliSilverMoved
        arrivalTime
        departureTime
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

        const result = await axios.post(url, JSON.stringify(body));

        // todo if hasIndexingErrors is true might want to not use that data until it shakes out, or notify someone or something
        if (result && result.data && result.data.data && result.data.data.arrivals) {

            if (result.data.data._meta.hasIndexingErrors) {
                throw 'graph not synced';
            }

            arrivals = [...arrivals, ...result.data.data.arrivals];
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
    var fs = require('fs');
    const arrivals = await getAllArrivals();
    const scoreboard = arrivals.map(a => {
        a.time = a.arrivalTime - a.departureTime;
    });

    const whale = scoreboard.sort((a, b) => b.milliSilverMoved - a.milliSilverMoved).slice(0, 1);
    console.log(whales);

    const long_distance_runners = scoreboard.sort((a, b) => b.time - a.time).slice(0, 10);
    console.log(long_distance_runners);
}

main()