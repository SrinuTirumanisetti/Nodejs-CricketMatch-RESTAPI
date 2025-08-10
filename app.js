const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const InitializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

InitializeDBAndServer();

// API 1: Get all players
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
      player_id AS playerId, 
      player_name AS playerName 
    FROM player_details
    ORDER BY player_id;`;
  const players = await db.all(getPlayersQuery);
  response.send(players);
});

// API 2: Get player by ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      player_id AS playerId,
      player_name AS playerName
    FROM player_details
    WHERE player_id = ?;`;
  const player = await db.get(getPlayerQuery, [playerId]);
  response.send(player);
});

// API 3: Update player
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
    UPDATE player_details 
    SET player_name = ? 
    WHERE player_id = ?;`;
  await db.run(updateQuery, [playerName, playerId]);
  response.send("Player Details Updated");
});

// API 4: Get match details
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
      match_id AS matchId,
      match,
      year
    FROM match_details
    WHERE match_id = ?;`;
  const match = await db.get(getMatchQuery, [matchId]);
  response.send(match);
});

// API 5: Get matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT 
      match_details.match_id AS matchId,
      match_details.match AS match,
      match_details.year AS year
    FROM player_match_score
    INNER JOIN match_details
      ON player_match_score.match_id = match_details.match_id
    WHERE player_match_score.player_id = ?;`;
  const matches = await db.all(getPlayerMatchesQuery, [playerId]);
  response.send(matches);
});

// API 6: Get players of a match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatchQuery = `
    SELECT 
      player_details.player_id AS playerId,
      player_details.player_name AS playerName
    FROM player_details
    INNER JOIN player_match_score
      ON player_details.player_id = player_match_score.player_id
    WHERE player_match_score.match_id = ?;`;
  const players = await db.all(getPlayersOfMatchQuery, [matchId]);
  response.send(players);
});

// API 7: Get player scores
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `
    SELECT 
      player_details.player_id AS playerId,
      player_details.player_name AS playerName,
      SUM(player_match_score.score) AS totalScore,
      SUM(player_match_score.fours) AS totalFours,
      SUM(player_match_score.sixes) AS totalSixes
    FROM player_details
    INNER JOIN player_match_score
      ON player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ?
    GROUP BY player_details.player_id;`;
  const playerStats = await db.get(getPlayerScoresQuery, [playerId]);
  response.send(playerStats);
});

// Export default
module.exports = app;
