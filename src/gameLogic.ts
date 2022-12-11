import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  child,
  get,
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  set,
} from "firebase/database";
import { getDefaultUserName } from "./helpers/getDefaultUserName";
import { env } from "./lib/env";

const secret = env.YOUR_SECRET;

const firebaseConfig = {
  apiKey: env.FIREBASE_KEY,
  authDomain: env.AUTH_DOMAIN,
  databaseURL: env.DATABASE_URL,
  projectId: env.PROJECT_ID,
  storageBucket: env.STOREAGE_BUCKET,
  messagingSenderId: env.MESSAGING_ID,
  appId: env.APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let playerId;
let playerRef;
let playerData: PlayerData;

const auth = getAuth();
const allGamesRef = ref(db, "games");

export function initAuth() {
  // Import the functions you need from the SDKs you need

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration

  function initGame(playerData: PlayerData) {
    const allPlayersRef = ref(db, "players");

    // onValue(allGamesRef, (snapshot) => {
    //   snapshot.forEach((gamesSnapShot) => {
    //     const childData = gamesSnapShot.val();
    //     console.log("🚀 ~ snapshot.forEach ~ childData", childData);
    //   });
    // });
    // startNewGame();

    //    if (!isInGame) {
    //  addNewPlayer("ElkGB", playerData.playerId, playerData);
    //    }
  }

  signInAnonymously(auth)
    .then(() => {
      console.log("looged in");
    })
    .catch((error) => {
      console.log(error.code, error.message);
    });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/firebase.User
      playerId = user.uid;
      playerRef = ref(db, "players/" + playerId);
      let currentGame = "";
      // check the games to see if you're in one, if not, they can join a game or create one

      playerData = {
        name: getDefaultUserName(),
        playerId: playerId,
        cards: [],
        wonCards: [],
        gameId: "ElkGB",
      };

      onValue(allGamesRef, (snapshot) => {
        snapshot.forEach((gamesSnapShot) => {
          const childData = gamesSnapShot.val();
          currentGame = childData?.[playerId]?.gameId;
          let gameRef = ref(db, "games/" + currentGame);
          onDisconnect(gameRef).remove();
        });
      });
      if (currentGame) {
        console.log("🚀 ~ .then ~ currentGame", currentGame);
      }
      // writeUserData(playerId, playerData);

      initGame(playerData);
    }
  });

  function joinGame(gameId, playerData) {
    const db = getDatabase();
    const allGamesRef = ref(db, "games");

    // onValue(allGamesRef, (snapshot) => {
    //   snapshot.forEach((gamesSnapShot) => {
    //     const childKey = gamesSnapShot.key;
    //     if (childKey === gameId) {
    //       console.log("game exists");
    //       addNewPlayer(gameId, playerData.playerId, playerData);
    //       return;
    //     } else {
    //       // createNewGame(gameId);
    //     }
    //   });

    //   set(ref(db, "games/" + gameId.replace(/\s+/g, "_")), {
    //     ...gameId,
    //   });
    // });
  }

  return {
    playerRef,
    playerData,
    joinGame,
  };
}

export function createNewGame(newGameId: string) {
  const db = getDatabase();
  set(ref(db, "games/" + newGameId), {
    gameId: newGameId,
  });
  console.log(newGameId);
  const dbRef = ref(getDatabase());
  get(child(dbRef, "games"))
    .then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((gamesSnapShot) => {
          const childData = gamesSnapShot.val();
          if (newGameId === childData.gameId) {
            console.log("🚀 ~ snapshot.forEach ~ childData", childData);
          }
        });
      } else {
        console.log("No data available");
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

function writeUserData(playerId, playerData) {
  const db = getDatabase();
  set(ref(db, "players/" + playerId), {
    name: getDefaultUserName(),
    cards: [],
    wonCards: [],
    gameId: "",
  });
}

// function startNewGame() {
//   console.log("anustart");
//   const db = getDatabase();
//   const gameId = makeGameId();
//   set(ref(db, "games/" + gameId), {
//     gameId: gameId,
//   });
// }

async function checkIfInGame(playerId) {
  const dbRef = ref(getDatabase());
  get(child(dbRef, "games"))
    .then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((gamesSnapShot) => {
          const childData = gamesSnapShot.val();
          return !!childData?.[playerId]?.gameId;
        });
      } else {
        console.log("No data available");
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

function addNewPlayer(gameId, playerId, playerData) {
  const db = getDatabase();
  set(ref(db, `games/${gameId}/${playerId}`), {
    ...playerData,
  });
}

export interface PlayerData {
  gameId: string;
  playerId: string;
  name: string;
  cards: string[];
  wonCards: string[];
}
interface GamesData {
  players: PlayerData;
}
