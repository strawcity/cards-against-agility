import type { Client } from "colyseus.js";
import { writable } from "svelte/store";

export default writable<Client>();
