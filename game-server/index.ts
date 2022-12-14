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
    switch (result.method) {
      case "create-game":
        // Expects a clientId and a nickname, returns a game and a list of players
        const playerId = result.playerId;
        const player = players[playerId];

        // Save player nickname
        player.nickname = result.nickname;

        // get a gameId, create a game
        const gameId = guid();
        games[gameId] = {
          id: gameId,
          // answerCards: answers,
          // questionCards: questions,
          players: [],
        };

        // Add player to game
        const game = games[gameId];
        game.players.push({
          playerId: player.playerId,
          nickname: player.nickname,
        });

        game.players = flatMap(games[gameId].players, (obj) => {
          return [{ playerId: obj.playerId, nickname: obj.nickname }];
        });

        const payLoad = {
          method: "create-game",
          game: games[gameId],
          nickname: result.nickname,
        };

        const con = players[playerId].connection;
        con.send(JSON.stringify(payLoad));

        return;
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
  //send back the client connect
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
