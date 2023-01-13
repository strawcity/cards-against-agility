export function getPlayerNickname(playerId: any, players: any) {
	for (const player of players) {
		if (player.playerId === playerId) {
			return player.nickname;
		}
	}
	return null;
}
