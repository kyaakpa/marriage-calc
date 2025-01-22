// Constants for scoring rules
const UNSEEN_PENALTY = -50; // Base penalty for not seeing joker
const WINNER_BONUS = 20; // Bonus points for winning

const calculateScores = (players, winnerId) => {
  // Validate inputs
  if (!players?.length || !winnerId) {
    throw new Error("Invalid inputs");
  }

  // First calculate base points for seen players
  const basePoints = players.map((player) => ({
    ...player,
    calculatedPoints: player.jokerSeen ? player.points : UNSEEN_PENALTY,
  }));

  // Calculate total points excluding winner's bonus
  const totalPoints = basePoints.reduce(
    (sum, player) =>
      sum + (player.id === winnerId ? 0 : player.calculatedPoints),
    0
  );

  // Winner gets negative of others' sum plus winner bonus
  return basePoints.map((player) => ({
    ...player,
    finalPoints:
      player.id === winnerId
        ? -totalPoints + WINNER_BONUS
        : player.calculatedPoints,
  }));
};

// Example usage:
const testPlayers = [
  { id: 1, name: "Alice", points: 30, jokerSeen: true },
  { id: 2, name: "Bob", points: 20, jokerSeen: true },
  { id: 3, name: "Charlie", points: 15, jokerSeen: false },
  { id: 4, name: "David", points: 25, jokerSeen: true },
];

const scores = calculateScores(testPlayers, 1);
console.log(scores);
