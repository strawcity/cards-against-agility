import { Schema, MapSchema, type } from "@colyseus/schema";
import { questions } from "../../../../src/data/questions.cjs";

export class Player extends Schema {
  @type("string") answer: string = "";
  @type("string") question: string = "";
  @type("string") wonCards: string[] = [];
}

export class State extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();
}

export class ConferenceRoomState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  @type("string") questionAsker: string = "";

  @type("string") questions: string[] = questions;

  @type("string") mySynchronizedProperty: string = "Hello world";
}
