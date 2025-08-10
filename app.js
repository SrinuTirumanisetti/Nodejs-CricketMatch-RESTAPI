const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const InitializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

InitializeDBAndServer();

app.get("/players", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details ORDER BY player_id;`;
  const players = await db.all(getPlayersQuery);
  response.json(players);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
      SELECT * FROM player_details
      WHERE player_id = ?;
    `;
  const player = await db.get(getPlayerQuery, [playerId]);
  response.json(player);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `update player_details set playerName=? where player_id=?;`;
  await db.run(updateQuery, [playerName, playerId]);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details where match_id=?;`;
  const match = await db.get(getMatchQuery, [matchId]);
  response.json(match);
});
