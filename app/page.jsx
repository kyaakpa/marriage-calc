"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [players, setPlayers] = useState([
    { id: 1, name: "", points: 0, isWinner: false, jokerSeen: false },
  ]);
  const [startGame, setStartGame] = useState(false);
  const [games, setGames] = useState([]);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Add useEffect to check system preference and localStorage
  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
  }, []);

  // Add toggle function
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
  };

  // Add at the top with other useEffect hooks
  useEffect(() => {
    const savedGames = localStorage.getItem("marriageGameHistory");
    const savedPlayers = localStorage.getItem("marriageGamePlayers");
    const savedGameState = localStorage.getItem("marriageGameState");

    if (savedGames) {
      setGames(JSON.parse(savedGames));
    }
    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers));
    }
    if (savedGameState) {
      setStartGame(JSON.parse(savedGameState));
    }
  }, []);

  // Add a reset function for the entire game
  const resetGame = () => {
    localStorage.removeItem("marriageGamePlayers");
    localStorage.removeItem("marriageGameHistory");
    localStorage.removeItem("marriageGameState");
    setPlayers([
      { id: 1, name: "", points: 0, isWinner: false, jokerSeen: false },
    ]);
    setGames([]);
    setStartGame(false);
  };
  const addPlayer = () => {
    if (players.length < 5) {
      setPlayers([
        ...players,
        {
          id: players.length + 1,
          name: "",
          points: 0,
          isWinner: false,
          jokerSeen: false,
        },
      ]);
    }
  };

  const removePlayer = (idToRemove) => {
    if (players.length > 1) {
      setPlayers(players.filter((player) => player.id !== idToRemove));
    }
  };

  const handleNameChange = (id, newName) => {
    setPlayers(
      players.map((player) =>
        player.id === id ? { ...player, name: newName } : player
      )
    );
  };

  const handleJokerSeen = (playerId) => {
    setPlayers(
      players.map((p) =>
        p.id === playerId ? { ...p, jokerSeen: !p.jokerSeen } : p
      )
    );
  };

  const handleWinner = (playerId) => {
    const playerToWin = players.find((p) => p.id === playerId);
    if (!playerToWin.jokerSeen) {
      setError("Player must see joker before winning!");
      return;
    }

    // Calculate total points of the game (excluding unseen players)
    const totalGamePoints =
      players.reduce((sum, player) => {
        return player.jokerSeen ? sum + player.points : sum;
      }, 0) + 3; // Add extra 3 points to total

    const numPlayers = players.length;

    const updatedPlayers = players.map((p) => {
      if (p.id === playerId) {
        // Winner calculation
        // (current points × number of players) - total game points + 10 from unseen + (3 × number of seen players) + 3 for winning
        const seenPlayersCount = players.filter(
          (player) => player.jokerSeen && player.id !== playerId
        ).length;
        const winnerPoints =
          p.points * numPlayers -
          totalGamePoints +
          10 +
          seenPlayersCount * 3 +
          3;

        return {
          ...p,
          isWinner: true,
          points: winnerPoints,
        };
      } else if (!p.jokerSeen) {
        // Unseen player calculation: -total points - 7
        return {
          ...p,
          isWinner: false,
          points: -totalGamePoints - 7,
        };
      } else {
        // Seen players calculation: (current points × number of players) - total game points
        const seenPlayerPoints = p.points * numPlayers - totalGamePoints;

        return {
          ...p,
          isWinner: false,
          points: seenPlayerPoints,
        };
      }
    });

    setPlayers(updatedPlayers);

    // Save game history
    const updatedGames = [
      ...games,
      {
        gameNo: games.length + 1,
        scores: updatedPlayers.reduce(
          (acc, player) => ({
            ...acc,
            [player.id]: player.points,
          }),
          {}
        ),
        winner: playerId,
      },
    ];

    setGames(updatedGames);
    localStorage.setItem("marriageGameHistory", JSON.stringify(updatedGames));

    // Reset for next round after delay
    setTimeout(() => {
      setPlayers(
        updatedPlayers.map((player) => ({
          ...player,
          points: 0,
          isWinner: false,
          jokerSeen: false,
        }))
      );
      setError("");
    }, 1500);
  };

  const deleteGame = (gameNoToDelete) => {
    // Filter out the game to delete
    const updatedGames = games.filter((game) => game.gameNo !== gameNoToDelete);

    // Renumber the remaining games
    const reorderedGames = updatedGames.map((game, index) => ({
      ...game,
      gameNo: index + 1,
    }));

    // Update state and localStorage
    setGames(reorderedGames);
    localStorage.setItem("marriageGameHistory", JSON.stringify(reorderedGames));
  };

  return (
    // Add at the top level div
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-gray-900 text-white"
          : "lg:bg-gradient-to-br lg:from-blue-50 lg:to-indigo-50"
      } py-8`}
    >
      {/* Add dark mode toggle button */}
      {/* <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-2 rounded-full bg-opacity-20 backdrop-blur-sm"
      >
        {darkMode ? "☀️" : "🌙"}
      </button> */}

      <div
        className={`max-w-6xl mx-auto lg:p-6 ${darkMode ? "text-white" : ""}`}
      >
        <h1
          className={`text-5xl font-bold tracking-tighter pb-8 text-center ${
            darkMode ? "text-white" : "text-black"
          }`}
        >
          Marriage Point Calculator
        </h1>

        {!startGame ? (
          <div className="p-8">
            <h2 className="text-xl font-semibold mb-4">Add Players</h2>
            <div className="space-y-4">
              {players.map((player) => (
                <div key={player.id} className="flex items-center gap-4">
                  <label htmlFor={`player${player.id}`} className="w-20">
                    Player {player.id}
                  </label>
                  <input
                    type="text"
                    id={`player${player.id}`}
                    value={player.name}
                    onChange={(e) =>
                      handleNameChange(player.id, e.target.value)
                    }
                    placeholder={`Enter player ${player.id} name`}
                    className="flex-1 p-2 border rounded"
                  />
                  {players.length > 1 && (
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 mt-4">
              {players.length < 8 && (
                <button
                  onClick={addPlayer}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Player
                </button>
              )}
              <button
                onClick={() => {
                  setStartGame(true);
                  localStorage.setItem(
                    "marriageGameState",
                    JSON.stringify(true)
                  );
                  localStorage.setItem(
                    "marriageGamePlayers",
                    JSON.stringify(players)
                  );
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                disabled={players.length < 2 || players.some((p) => !p.name)}
              >
                Start Game
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 bg-white lg:p-6 max-lg:py-2 rounded-xl lg:shadow-sm">
            {/* Error message with improved styling */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">⚠️</div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-4 max-lg:p-4">
              {" "}
              {/* Reduced spacing from 6 to 4 */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-4 rounded-xl border-1 shadow-md border-dotted ${
                      darkMode
                        ? player.isWinner
                          ? "border-green-500 bg-green-900 bg-opacity-20"
                          : player.jokerSeen
                          ? "border-blue-500 bg-blue-900 bg-opacity-20"
                          : "border-gray-700 bg-gray-800"
                        : player.isWinner
                        ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100"
                        : player.jokerSeen
                        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold mb-2 text-base">
                      {" "}
                      {/* Reduced font and margin */}
                      {player.name}
                    </div>
                    <div className="mb-2">
                      {" "}
                      {/* Reduced margin */}
                      <div className="text-xs text-gray-600 mb-1">Points</div>
                      <input
                        type="number"
                        value={player.points === 0 ? "" : player.points}
                        onChange={(e) => {
                          const newPoints = parseInt(e.target.value) || 0;
                          setPlayers(
                            players.map((p) =>
                              p.id === player.id
                                ? { ...p, points: newPoints }
                                : p
                            )
                          );
                        }}
                        className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          darkMode
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-200"
                        }`}
                        placeholder="Enter points"
                      />
                    </div>
                    <div className="space-y-1">
                      {" "}
                      {/* Reduced spacing */}
                      <button
                        onClick={() => handleJokerSeen(player.id)}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          darkMode
                            ? player.jokerSeen
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-red-900 bg-opacity-20 text-red-300 hover:bg-opacity-30"
                            : player.jokerSeen
                            ? "bg-blue-500 text-white shadow-sm hover:bg-blue-600"
                            : "bg-red-100 text-red-900 hover:bg-red-200"
                        }`}
                      >
                        {player.jokerSeen ? "Seen ✓" : "Unseen"}
                      </button>
                      <button
                        onClick={() => handleWinner(player.id)}
                        disabled={!player.jokerSeen || player.isWinner}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          player.isWinner
                            ? "bg-green-500 text-white shadow-sm"
                            : player.jokerSeen
                            ? "bg-gray-100 hover:bg-gray-200"
                            : "bg-gray-100 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {player.isWinner ? "Winner! 🏆" : "Declare"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {games.length > 0 && (
              <div
                className={`mt-8 transition-colors duration-200 ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white lg:shadow-sm border-gray-200"
                } lg:rounded-xl border overflow-hidden`}
              >
                <h2
                  className={`text-xl font-semibold p-4 border-b ${
                    darkMode
                      ? "bg-gray-900 border-gray-700"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  Game History
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border-b border-gray-200 p-3 text-left">
                          Round
                        </th>
                        {players.map((player) => (
                          <th
                            key={player.id}
                            className="border border-t-0 border-gray-300 p-2"
                            title={player.name}
                          >
                            {player.name.substring(0, 4).toUpperCase()}
                          </th>
                        ))}
                        <th className="border border-t-0 border-gray-300">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {games.map((game) => (
                        <tr
                          key={game.gameNo}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="border border-gray-300 p-2 text-center">
                            {game.gameNo}
                          </td>
                          {players.map((player) => (
                            <td
                              key={player.id}
                              className={`border border-gray-300 p-2 text-center ${
                                game.winner === player.id ? "bg-green-100" : ""
                              }`}
                            >
                              {game.scores[player.id]}
                            </td>
                          ))}
                          <td className="border border-gray-300 p-2 text-center">
                            <button
                              onClick={() => deleteGame(game.gameNo)}
                              className="text-red-600 hover:bg-red-100 px-2 py-1 rounded"
                              title="Delete this game"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td className="border border-gray-300 p-2 text-center">
                          Total
                        </td>
                        {players.map((player) => (
                          <td
                            key={player.id}
                            className="border border-gray-300 p-2 text-center"
                          >
                            {games.reduce(
                              (sum, game) =>
                                sum + (game.scores[player.id] || 0),
                              0
                            )}
                          </td>
                        ))}
                        <td className="border border-gray-300 p-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="p-4">
              <button
                onClick={resetGame}
                className={`px-4 py-2 rounded transition-colors duration-200 ${
                  darkMode
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-500 hover:bg-red-600"
                } text-white`}
              >
                Reset Entire Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
