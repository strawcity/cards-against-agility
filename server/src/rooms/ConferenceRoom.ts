import { Room, Client } from "colyseus";
import { ConferenceRoomState } from "./schema/ConferenceRoomSchema";

export class ConferenceRoom extends Room<ConferenceRoomState> {
  maxClients = 4;

  onCreate(options: any) {
    this.setState(new ConferenceRoomState());

    // Called every time this room receives a "move" message
    this.onMessage("playCard", (client, data) => {
      const player = this.state.players.get(client.sessionId);

      console.log(client.sessionId + " played " + player.answer);
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  async onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    await this.allowReconnection(client, 20);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
