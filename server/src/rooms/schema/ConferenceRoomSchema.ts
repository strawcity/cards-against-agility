import { Schema, MapSchema, type } from "@colyseus/schema";

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

  questions: string[] = questions;

  @type("string") mySynchronizedProperty: string = "Hello world";
}

let questions = [
  "This is the way the world ends.Not with a bang but with ----------------------- .",
  "Dear Abby, I'm having some trouble with -----------------------  and would like your advice.",
  "Kids, I don't need drugs to get high on. I'm high on-----------------------,",
  "I'm sorry sir, but I couldn't complete my homework because of-----------------------",
  "Well, if you'll excuse me, gentlemen, I have a date with ----------------------- ",
  "A recent laboratory study shows that undergraduates have 50 % less sex after being exposed to-----------------------",
  "  Why can't I sleep at night? ----------------------- ",
  "I never trully understood----------------------- until I encountered----------------------- .",
  "In a world ravaged by----------------------- our only solace is----------------------- .",
  "Maybe she's born with it. Maybe it's-----------------------",
  "  It's a pitty that kids these days are all getting involved with ----------------------- ",
  "Introducing the amazing Superhero / Sidekick duo! It's -----------------------  and ----------------------- ",
  "They said we were crazy.They said we could not put----------------------- inside of----------------------- .They were vwrong!",
  "What ended my last relationship ? -----------------------",
  "  ----------------------- ? Jim will fix it!",
  "I got 99 problems, but----------------------- ain't one.",
  "Why do i hurt all over ? -----------------------",
  "  What's that sound? ----------------------- ",
  "I drink to forget----------------------- .",
  "Step 1: ----------------------Step 2: ---------------------- Step 3: Profit",
  "The theme for next year's Eurovisio Song Contest is 'We are-----------------------' ",
  "----------------------- good to the last drop.",
  "For my next trick I will pull----------------------- out of-----------------------",
  "How am I maintaining my relationship status ? -----------------------",
  "War! What is it good for? -----------------------",
  "Why am I sticky ? -----------------------",
  "What's my secret power? -----------------------",
  "What did I brring back from Amsterdam ?",
  "Airport security guidelines now prohibit----------------------- on airplanes.",
  "----------------------- is a slippery slope that leads to-----------------------",
  "A romantic candle - lit dinner would be incomplete without-----------------------",
  "----------------------- +  -----------------------  = -----------------------",
  "The customer wants-----------------------",
  "We need to automate-----------------------",
  "Every team should have-----------------------",
  "----------------------- will help us achieve our business goals",
  "We have always done-----------------------",
  "Don't show ----------------------- in the review!",
  "----------------------- really turns me on!",
  "We tried----------------------- already, and it does not work.",
  "----------------------- was not in the contract",
];
