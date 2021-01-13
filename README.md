# darkforest-graph-leaderboard

Showcase for querying thegraph v05 darkforest from node.

## install

`yarn`

## run

`yarn run scoreboard` for a paged query downloading every planet at game end (takes several minutes) and computing the score. Since its downloading at game end and data wont change, if you want to make changes to the query its better to keep your planets.json file and just run `node scoreboard_compute.js` which is fast.

Or `yarn run legendary` for a simpler non paged query of how many legendaries have been found and by who. Also shows how to tie addresses to twitter handles.
