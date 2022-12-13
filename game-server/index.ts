const { answers, questions } = require("./cards/data.cjs");
const http = require("http");
const app = require("express")();
const websocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening.. on 9090"));

const clients = {};
const games = {};

const wsServer = new websocketServer({
  httpServer: httpServer,
});
wsServer.on("request", (request) => {
  //connect
  const connection = request.accept(null, request.origin);
  connection.on("open", () => console.log("opened!"));
  connection.on("close", () => console.log("closed!"));
  connection.on("message", (message) => {
    const result = JSON.parse(message.utf8Data);
    //I have received a message from the client
    //a user want to create a new game
    if (result.method === "create") {
      const clientId = result.clientId;
      const gameId = guid();
      games[gameId] = {
        id: gameId,
        answerCards: answers,
        questionCards: questions,
        clients: [],
      };

      const payLoad = {
        method: "create",
        game: games[gameId],
      };

      const con = clients[clientId].connection;
      con.send(JSON.stringify(payLoad));
    }

    if (result.method === "save-nickname") {
      const clientId = result.clientId;
      clients[clientId].nickname = result.nickname;

      const payLoad = {
        method: "return-nickname",
        nickname: result.nickname,
      };

      const con = clients[clientId].connection;
      con.send(JSON.stringify(payLoad));
    }

    //a client want to join
    if (result.method === "join") {
      const clientId = result.clientId;
      const playerTitle = result.playerTitle;
      const client = clients[clientId];
      const gameId = result.gameId;
      const game = games[gameId];

      if (!gameId || !game) {
        const payLoad = {
          method: "invalid-game-id",
        };
        const con = clients[clientId].connection;
        con.send(JSON.stringify(payLoad));
        return;
      }

      if (
        game.clients.length >= 6 ||
        game.clients.find((client) => {
          return client.clientId === clientId;
        })
      ) {
        //sorry max players reach
        return;
      }

      game.clients.push({
        clientId: client.clientId,
        nickname: client.nickname,
        playerTitle: playerTitle,
      });

      // //start the game
      // // updateGameState();
      // if (game.clients.length >= 2) updateGameState();

      const payLoad = {
        method: "join",
        game: game,
      };
      //loop through all clients and tell them that people has joined
      game.clients.forEach((c) => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad));
      });
    }

    //a wants to start the game
    if (result.method === "start") {
      const clientId = result.clientId;
      const client = clients[clientId];
      const nickname = result.nickname;
      const gameId = result.gameId;
      const game = games[gameId];

      if (!gameId || !game) {
        const payLoad = {
          method: "invalid-game-id",
        };
        const con = clients[clientId].connection;
        con.send(JSON.stringify(payLoad));
        return;
      }

      if (game.clients.length >= 6) {
        //sorry max players reach
        return;
      }

      game.clients.push({
        clientId: client.clientId,
        answerCards: distributeCards(game.answerCards),
        nickname: client.nickname,
        playerTitle: client.playerTitle,
      });

      //start the game
      // updateGameState();
      if (game.clients.length >= 2) updateGameState();

      const payLoad = {
        method: "start",
        game: game,
      };
      //loop through all clients and tell them that people has joined
      game.clients.forEach((c) => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad));
      });
    }

    //a user plays
    if (result.method === "play") {
      const gameId = result.gameId;
      const ballId = result.ballId;
      const color = result.color;
      let state = games[gameId].state;
      if (!state) state = {};

      state[ballId] = color;
      games[gameId].state = state;
    }
  });

  //generate a new clientId
  const clientId = guid();
  clients[clientId] = {
    clientId: clientId,
    nickname: null,
    connection: connection,
  };

  const payLoad = {
    method: "connect",
    clientId: clientId,
    playerTitle: getDefaultUserName(),
  };
  //send back the client connect
  connection.send(JSON.stringify(payLoad));
});

function updateGameState() {
  //{"gameid", fasdfsf}
  for (const g of Object.keys(games)) {
    const game = games[g];
    const payLoad = {
      method: "update",
      game: game,
    };

    game.clients.forEach((c) => {
      clients[c.clientId].connection.send(JSON.stringify(payLoad));
    });
  }

  setTimeout(updateGameState, 500);
}

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

function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}
function getDefaultUserName() {
  const levels = randomFromArray([
    "Junior",
    "Senior",
    "10x",
    "Staff",
    "Rockstar",
    "Mid",
    "Basic ass",
    "Ninja",
    "Guru",
    "Maverick",
    "Wizard",
  ]);

  const roles = randomFromArray([
    "PM",
    "Developer",
    "Designer",
    "PO",
    "Scrum Master",
    "Enginner",
    "UX Researcher",
    "Dev Rel",
    "Engineering Manger",
  ]);

  return `${levels} ${roles}`;
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
