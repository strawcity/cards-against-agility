const { answers, questions } = require("./cards/data.cjs");
const http = require("http");
const websocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(1999, () => console.log("Listening.. on 1999"));

const players = {};
const games = {};

const wsServer = new websocketServer({
  httpServer: httpServer,
});

wsServer.on("request", (request) => {
  const connection = request.accept(null, request.origin);
  connection.on("open", () => console.log("opened!"));
  connection.on("close", () => console.log("closed!"));

  connection.on("message", (message) => {
    const result = JSON.parse(message.utf8Data);
    if (result.method === "create-game") {
      // Expects a playerId and a nickname, returns a game and a list of players
      const playerId = result.playerId;
      const player = players[playerId];

      // Save player nickname
      player.nickname = result.nickname;

      // get a gameId, create a game
      const gameId = guid();
      games[gameId] = {
        id: gameId,
        players: [],
      };

      // Add player to game
      const game = games[gameId];
      game.players.push({
        playerId: player.playerId,
        nickname: player.nickname,
      });

      const payLoad = {
        method: "create-game",
        game: games[gameId],
        nickname: result.nickname,
      };

      const con = players[playerId].connection;
      con.send(JSON.stringify(payLoad));
    }

    if (result.method === "join-game") {
      // Expects a playerId and a nickname, returns a game and a list of players
      const playerId = result.playerId;
      const gameId = result.gameId;
      const player = players[playerId];

      // Save player nickname
      player.nickname = result.nickname;

      // Add player to game
      const game = games[gameId];
      game.players.push({
        playerId: player.playerId,
        nickname: player.nickname,
      });

      const payLoad = {
        method: "join-game",
        game: games[gameId],
        nickname: result.nickname,
      };

      game.players.forEach((player) => {
        players[player.playerId].connection.send(JSON.stringify(payLoad));
      });
    }

    if (result.method === "start-game") {
      const playerId = result.playerId;
      const gameId = result.gameId;
      const game = games[gameId];

      game.answerCards = answers;
      console.log("🚀 ~ connection.on ~ game.answerCards", game.answerCards);
      game.questionCards = questions;

      if (game.players.length >= 6) {
        //sorry max players reach
        return;
      }

      game.players.forEach((player) => {
        const payLoad = {
          method: "start-game",
          answerCards: distributeCards(game.answerCards),
        };
        players[player.playerId].connection.send(JSON.stringify(payLoad));
      });

      console.log(game.players);

      // game.players.push({
      //   playerId: player.playerId,
      //   answerCards: distributeCards(game.answerCards),
      //   nickname: player.nickname,
      //   playerTitle: player.playerTitle,
      // });
    }
  });

  //generate a new playerId
  const playerId = guid();
  players[playerId] = {
    playerId: playerId,
    nickname: null,
    connection: connection,
  };

  // on 'connect', send the playerId
  const payLoad = {
    method: "connect",
    playerId: playerId,
  };
  //send back the player connect
  connection.send(JSON.stringify(payLoad));
});

// then to call it, plus stitch in '4' in the third group
const guid = () => {
  // Create an array of all the possible characters that can be in the string
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  // Initialize the string to be returned
  var str = "";

  // Generate 5 random characters from the array and add them to the string
  for (var i = 0; i < 5; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }

  // Return the final string
  return str;
};

function flatMap(arr, callback) {
  return arr.map(callback).flat();
}

function distributeCards(array) {
  // Check if the array has at least 5 elements
  if (array.length < 5) {
    return array;
  }

  // Create a new arrayay with the first 5 elements of the original arrayay
  let newArray = array.slice(0, 5);

  // Remove the first 5 elements from the original arrayay
  array.splice(0, 5);

  // Return the new arrayay
  return newArray;
}
