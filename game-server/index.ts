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
        submittedCards: [],
      };

      // Add player to game
      const game = games[gameId];
      console.log("🚀 ~ connection.on ~ game", game);
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
      const game = games[gameId];

      if (game.players.length > 6) {
        //sorry max players reach
        return;
      }

      // Save player nickname
      player.nickname = result.nickname;

      // Add player to game

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
      const gameId = result.gameId;
      const game = games[gameId];

      game.answerCards = answers;
      game.questionCards = questions;

      // The initial position is 0 for 'start-game'
      game.playerRotationPosition = 0;
      game.players[game.playerRotationPosition].isAskingQuestion;

      // Everyone gets to see the question card
      game.questionCard = distributeCards(game.questionCards, 1);

      game.players.forEach((player, index) => {
        game.players[index].isAskingQuestion =
          game.playerRotationPosition === index;
        // The current asker shouldn't be able to play a card, so they need to know that they are the asker
        const payLoad = {
          method: "start-game",
          answerCards: distributeCards(game.answerCards, 5),
          questionCard: game.questionCard,
          isAskingQuestion: player.isAskingQuestion,
        };
        console.log("🚀 ~ game.players.forEach ~ payLoad", payLoad);
        players[player.playerId].connection.send(JSON.stringify(payLoad));
      });

      console.log(game.players);
    }

    if (result.method === "submit-card") {
      const submittedCard = result.submittedCard;
      const playerId = result.playerId;
      const gameId = result.gameId;
      const game = games[gameId];
      // console.log("🚀 ~ connection.on ~ game", game);

      // Adding submittedCard to game's submitted cards
      game.submittedCards.push({ player: playerId, card: submittedCard });

      game.players.forEach((player) => {
        // If the person is asking the question, they should get the other cards
        if (player.isAskingQuestion) {
          const payLoad = {
            method: "receive-answer-card",
            submittedCards: game.submittedCards,
          };
          players[player.playerId].connection.send(JSON.stringify(payLoad));

          // If all cards are submitted, start reviewing
        }
        if (game.submittedCards.length === game.players.length - 1) {
          // If the person is asking the question, they should get the other cards

          const payLoad = {
            method: "start-card-review",
          };
          players[player.playerId].connection.send(JSON.stringify(payLoad));
        }
      });
    }

    if (result.method === "show-current-answer") {
      const playerId = result.playerId;
      const answer = result.answer;
      const gameId = result.gameId;
      const game = games[gameId];

      game.players.forEach((player) => {
        const payLoad = {
          method: "show-answer",
          inFocusCard: { player: playerId, answer: answer },
        };
        players[player.playerId].connection.send(JSON.stringify(payLoad));
      });
    }
  });

  //generate a new playerId
  const playerId = guid();
  players[playerId] = {
    playerId: playerId,
    nickname: null,
    isAskingQuestion: false,
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

function distributeCards(array, numberOfCards) {
  // Check if the array has at least 5 elements
  if (array.length < numberOfCards) {
    return array;
  }

  // Create a new arrayay with the first numberOfCards elements of the original arrayay
  let newArray = array.slice(0, numberOfCards);

  // Remove the first numberOfCards elements from the original arrayay
  array.splice(0, numberOfCards);

  // Return the new arrayay

  if (newArray.length > 1) {
    return newArray;
  } else {
    return newArray[0];
  }
}
