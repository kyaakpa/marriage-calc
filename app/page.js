"use client";

import { toPng } from "html-to-image";
import { useState, useEffect, useRef } from "react";
import { X, Trophy, Eye, EyeOff, RotateCcw, Share2, Save } from "lucide-react";
import DealerTracker from "./components/DealerTracker";

export default function Home() {
  const scoreboardRef = useRef(null);
  const [savedGamesMetadata, setSavedGamesMetadata] = useState([]);
  const [saveGameName, setSaveGameName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [players, setPlayers] = useState([
    {
      id: 1,
      name: "",
      points: 0,
      isWinner: false,
      jokerSeen: false,
      roundPoints: 0,
      inputRef: useRef(null),
    },
  ]);
  const [startGame, setStartGame] = useState(false);
  const [games, setGames] = useState([]);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDealerModal, setShowDealerModal] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("./serviceWorkerRegistration").then((reg) => reg.register());
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
  };

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

  useEffect(() => {
    const savedGames = localStorage.getItem("savedGames");
    if (savedGames) {
      setSavedGamesMetadata(JSON.parse(savedGames));
    }
  }, []);

  const handleSaveGame = () => {
    if (!saveGameName.trim()) {
      setError("Please enter a name for your saved game");
      return;
    }

    const gameData = {
      id: Date.now(),
      name: saveGameName,
      date: new Date().toISOString(),
      players,
      games,
      startGame,
    };

    const existingSavedGames = JSON.parse(
      localStorage.getItem("savedGames") || "[]"
    );
    const updatedSavedGames = [...existingSavedGames, gameData];

    localStorage.setItem("savedGames", JSON.stringify(updatedSavedGames));
    setSavedGamesMetadata(updatedSavedGames);

    setSaveGameName("");
    setShowSaveModal(false);
    alert("Game saved successfully!");
  };

  const loadSavedGame = (gameData) => {
    setPlayers(gameData.players);
    setGames(gameData.games);
    setStartGame(gameData.startGame);

    localStorage?.setItem(
      "marriageGamePlayers",
      JSON.stringify(gameData.players)
    );
    localStorage?.setItem(
      "marriageGameHistory",
      JSON.stringify(gameData.games)
    );
    localStorage?.setItem(
      "marriageGameState",
      JSON.stringify(gameData.startGame)
    );
  };

  const shareScoreboard = async () => {
    if (!scoreboardRef.current) return;

    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const element = scoreboardRef.current;
      const opt = {
        margin: 1,
        filename: "marriage-game-scores.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
      };

      const pdf = await html2pdf().set(opt).from(element).save();

      // For mobile sharing
      if (navigator.share) {
        try {
          // Convert the pdf to blob
          const pdfBlob = await html2pdf()
            .set(opt)
            .from(element)
            .output("blob");
          const file = new File([pdfBlob], "marriage-game-scores.pdf", {
            type: "application/pdf",
          });

          await navigator.share({
            title: "Marriage Card Game Scores",
            files: [file],
          });
        } catch (error) {
          // If sharing fails, the pdf would have already been downloaded
          console.error("Error sharing:", error);
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF");
      setTimeout(() => setError(""), 2000);
    }
  };

  const resetGame = () => {
    localStorage.removeItem("marriageGamePlayers");
    localStorage.removeItem("marriageGameHistory");
    localStorage.removeItem("marriageGameState");
    setPlayers([
      {
        id: 1,
        name: "",
        points: 0,
        isWinner: false,
        jokerSeen: false,
        roundPoints: 0,
      },
    ]);
    setGames([]);
    setStartGame(false);
  };

  const addPlayer = () => {
    if (players.length < 8) {
      const newPlayerId = players.length + 1;
      setPlayers([
        ...players,
        {
          id: newPlayerId,
          name: "",
          points: 0,
          isWinner: false,
          jokerSeen: false,
          roundPoints: 0,
        },
      ]);
      setTimeout(() => {
        document.querySelector(`#player${newPlayerId}`)?.focus();
      }, 100);
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
      players.map((p) => {
        if (p.id === playerId) {
          const newJokerSeen = !p.jokerSeen;
          if (newJokerSeen) {
            setTimeout(() => {
              document.querySelector(`#points-input-${playerId}`)?.focus();
            }, 100);
          }
          return { ...p, jokerSeen: newJokerSeen };
        }
        return p;
      })
    );
  };

  const handleWinnerSelect = (playerId) => {
    const playerToWin = players.find((p) => p.id === playerId);
    if (!playerToWin.jokerSeen) {
      setError("Player must see joker before being selected as winner!");
      return;
    }

    if (selectedWinner === playerId) {
      setSelectedWinner(null);
    } else {
      setSelectedWinner(playerId);
    }
    setError("");
  };

  const submitScores = () => {
    if (!selectedWinner) {
      setError("Please select a winner first!");
      return;
    }

    if (isSubmitting) {
      setError("Please wait until the scores are processed.");
      return;
    }

    setIsSubmitting(true);

    const playersWithRoundPoints = players.map((player) => ({
      ...player,
      roundPoints: player.points,
    }));

    // Calculate total maal (sum of points from seen players only)
    const totalMaal = playersWithRoundPoints.reduce((sum, player) => {
      return player.jokerSeen ? sum + player.points : sum;
    }, 0);

    const numPlayers = playersWithRoundPoints.length;

    // First calculate points for non-winner players
    let nonWinnerPoints = [];
    playersWithRoundPoints.forEach((p) => {
      if (p.id !== selectedWinner) {
        let points;
        if (!p.jokerSeen) {
          // Unseen player: -total maal - 10
          points = -totalMaal - 10;
        } else {
          // Seen player: (points × number of players) - total maal - 3
          points = p.points * numPlayers - totalMaal - 3;
        }
        nonWinnerPoints.push(points);
      }
    });

    // Winner's points are negative sum of all other players' points
    const winnerPoints = -nonWinnerPoints.reduce(
      (sum, points) => sum + points,
      0
    );

    // Create final updated players array
    const updatedPlayers = playersWithRoundPoints.map((p) => {
      if (p.id === selectedWinner) {
        return {
          ...p,
          isWinner: true,
          points: winnerPoints,
        };
      } else if (!p.jokerSeen) {
        return {
          ...p,
          isWinner: false,
          points: -totalMaal - 10,
        };
      } else {
        return {
          ...p,
          isWinner: false,
          points: p.points * numPlayers - totalMaal - 3,
        };
      }
    });

    setPlayers(updatedPlayers);

    // Save game history with roundPoints
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
        roundPoints: updatedPlayers.reduce(
          (acc, player) => ({
            ...acc,
            [player.id]: player.roundPoints,
          }),
          {}
        ),
        winner: selectedWinner,
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
          roundPoints: 0,
        }))
      );
      setSelectedWinner(null);
      setError("");
      setIsSubmitting(false);
    }, 1500);
  };

  const deleteGame = (gameNoToDelete) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete round ${gameNoToDelete}?`
    );

    if (isConfirmed) {
      const updatedGames = games.filter(
        (game) => game.gameNo !== gameNoToDelete
      );
      const reorderedGames = updatedGames.map((game, index) => ({
        ...game,
        gameNo: index + 1,
      }));
      setGames(reorderedGames);
      localStorage.setItem(
        "marriageGameHistory",
        JSON.stringify(reorderedGames)
      );
    }
  };

  return (
    <div
      className={` ${
        darkMode
          ? "bg-gray-900 text-white"
          : "lg:bg-gradient-to-br lg:from-blue-50 lg:to-indigo-50"
      } lg:pt-8`}
    >
      {typeof window !== "undefined" && showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`bg-white rounded-lg p-6 max-w-md w-full ${
              darkMode ? "bg-gray-800" : ""
            }`}
          >
            <h3 className="text-lg font-semibold mb-4">Save Game</h3>
            <input
              type="text"
              value={saveGameName}
              onChange={(e) => setSaveGameName(e.target.value)}
              placeholder="Enter a name for your saved game"
              className={`w-full p-2 border rounded mb-4 ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : ""
              }`}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGame}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`max-w-6xl mx-auto lg:p-6 ${darkMode ? "text-white" : ""}`}
      >
        <h1
          className={`lg:block mt-12 ${
            !startGame ? "block" : "hidden"
          } text-5xl font-bold tracking-tighter pb-8 text-center ${
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
                      <X size={20} />
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
              {savedGamesMetadata.length > 0 && (
                <div
                  className={`mt-4 p-4 border rounded-lg ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <h3 className="font-semibold mb-2">Saved Games</h3>
                  <div className="space-y-2">
                    {savedGamesMetadata.map((game) => (
                      <div
                        key={game.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <div className="font-medium">{game.name}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(game.date).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => loadSavedGame(game)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Load
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-between  lg:p-6 rounded-xl lg:shadow-sm">
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

            {games.length > 0 && (
              <div
                className={`mb-8 transition-colors duration-200 ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white lg:shadow-sm border-gray-200"
                } lg:rounded-xl overflow-hidden`}
              >
                <div
                  className={`flex justify-between text-xl font-semibold p-4 border-b ${
                    darkMode
                      ? "bg-gray-900 border-gray-700"
                      : "bg-neutral-900 text-white border-neutral-800"
                  }`}
                >
                  Game History
                  <div className="flex">
                    <button
                      onClick={shareScoreboard}
                      className="mr-4 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full flex items-center gap-2 text-base"
                    >
                      <Share2 size={18} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => setShowSaveModal(true)}
                      className="mr-4 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 rounded-full"
                    >
                      <Save size={19} strokeWidth={2} />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto " ref={scoreboardRef}>
                  <table className="w-full text-sm border-collapse bg-neutral-200">
                    <thead>
                      <tr className="bg-neutral-900 border border-black text-white">
                        <th className=" text-center font-normal">No.</th>
                        {players.map((player) => (
                          <th
                            key={player.id}
                            className="p-2 font-normal"
                            title={player.name}
                          >
                            {player.name.substring(0, 4).toUpperCase()}
                          </th>
                        ))}
                        <th className="border-neutral-800 font-normal">
                          Dismiss <br /> round ?
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {games.map((game) => (
                        <tr
                          key={game.gameNo}
                          className="hover:bg-gray-50 transition-colors font-semibold"
                        >
                          <td className="border border-gray-300 p-2 text-center">
                            {game.gameNo}
                          </td>
                          {players.map((player) => (
                            <td
                              key={player.id}
                              className={`border border-gray-300 p-2 text-center ${
                                game.winner === player.id
                                  ? "bg-green-200 text-green-900"
                                  : ""
                              }`}
                            >
                              {game.scores[player.id]}
                              <sup>{game.roundPoints[player.id]}</sup>
                            </td>
                          ))}
                          <td className="border border-gray-300 p-2 text-center">
                            <button
                              onClick={() => deleteGame(game.gameNo)}
                              className="text-red-600 hover:bg-red-100 px-2 py-1 rounded"
                            >
                              <X size={18} />
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
            <div className="space-y-4 ">
              <div className="flex flex-col gap-2 bg-neutral-50 text-black">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-2 md:px-3 md:pt-2 flex justify-between items-center md:rounded-xl md:border-1 md:shadow-md border-dotted ${
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
                    <div className="font-semibold mb-2 lg:w-20 w-14 text-base">
                      {player.name.toLowerCase()}
                    </div>
                    <div className="flex flex-col ">
                      {player.jokerSeen && (
                        <>
                          <input
                            id={`points-input-${player.id}`}
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
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
                            className={`max-w w-10 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                              darkMode
                                ? "bg-gray-800 border-gray-700 text-white"
                                : "bg-white border-gray-200"
                            }`}
                            aria-placeholder="enter points"
                          />
                          <label className="text-neutral-600 text-sm">
                            Points
                          </label>
                        </>
                      )}
                    </div>

                    <div className="space-y-1 flex gap-3 w-1/2">
                      <button
                        onClick={() => handleJokerSeen(player.id)}
                        className={`w-full px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                          darkMode
                            ? player.jokerSeen
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-red-900 bg-opacity-20 text-red-300 hover:bg-opacity-30"
                            : player.jokerSeen
                            ? "bg-blue-500 text-white shadow-sm hover:bg-blue-600"
                            : "bg-red-100 text-red-900 hover:bg-red-200"
                        }`}
                      >
                        {player.jokerSeen ? (
                          <>
                            <Eye size={18} /> Seen
                          </>
                        ) : (
                          <>
                            <EyeOff size={18} /> Unseen
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleWinnerSelect(player.id)}
                        disabled={!player.jokerSeen}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
                          player.id === selectedWinner
                            ? "bg-green-500 text-white shadow-sm"
                            : player.jokerSeen
                            ? "bg-gray-100 hover:bg-gray-200"
                            : "bg-gray-100 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {player.id === selectedWinner ? (
                          <>
                            <Trophy size={18} /> Winner
                          </>
                        ) : (
                          <>
                            <Trophy size={18} /> Select Winner
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                {selectedWinner && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={submitScores}
                      disabled={isSubmitting}
                      className={`px-6 py-3 text-white rounded-lg font-medium transition-colors duration-200 ${
                        isSubmitting
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Scores"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              className="bg-black p-4 text-white w-fit"
              onClick={() => setShowDealerModal(true)}
            >
              show dealer
            </button>
            {showDealerModal && (
              <>
                <DealerTracker
                  players={players}
                  darkMode={darkMode}
                  showDealerModal={showDealerModal}
                />
              </>
            )}
            <button
              onClick={resetGame}
              className={`w-full py-4 transition-colors duration-200 fixed bottom-0 left-0 right-0 md:static md:mt-32 md:rounded font-bold
    ${
      darkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
    } text-white flex items-center justify-center gap-2`}
            >
              <RotateCcw size={18} strokeWidth={2} /> Reset Entire Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
