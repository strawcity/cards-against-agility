export function getPlayerNickname(playerId, players) {
  for (const player of players) {
    if (player.playerId === playerId) {
      return player.nickname;
    }
  }
  return null;
}
