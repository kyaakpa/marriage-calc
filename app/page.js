"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Play,
  Trophy,
  Eye,
  EyeOff,
  Share2,
  Save,
  House,
  User,
} from "lucide-react";
import { supabase } from "./lib/supabase";

export default function Home() {
  const [gameId, setGameId] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const scoreboardRef = useRef(null);
  const [savedGamesMetadata, setSavedGamesMetadata] = useState([]);
  const [saveGameName, setSaveGameName] = useState("");
  const [calculatedScores, setCalculatedScores] = useState([]);
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
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  useEffect(() => {
    if (startGame) {
      // Check if we have an existing game ID in localStorage
      const savedGameId = localStorage.getItem("currentGameId");

      if (savedGameId) {
        // Resume existing game
        setGameId(savedGameId);
        setShareUrl(`${window.location.origin}/watch/id=${savedGameId}`);
      } else if (!gameId) {
        // Create new game ID
        const newGameId = crypto.randomUUID();
        setGameId(newGameId);
        setShareUrl(`${window.location.origin}/watch/${newGameId}`);

        // Save to localStorage
        localStorage.setItem("currentGameId", newGameId);

        // Create game in Supabase
        const createGame = async () => {
          const { error } = await supabase.from("games").insert([
            {
              id: newGameId,
              players,
              games: [],
              last_update: new Date().toISOString(),
            },
          ]);

          if (error) console.error("Error creating game:", error);
        };

        createGame();
      }
    }
  }, [startGame]);

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    const saveState = () => {
      const gameState = {
        players,
        games,
        startGame,
        lastSaved: new Date().toISOString(),
      };

      localStorage.setItem("marriageGameAutoSave", JSON.stringify(gameState));
      setLastSaved(new Date().toISOString());
    };

    // Save whenever these states change
    const autoSaveTimer = setTimeout(saveState, 1000);

    return () => clearTimeout(autoSaveTimer);
  }, [players, games, startGame]);

  // Load auto-saved state on component mount
  useEffect(() => {
    const savedState = localStorage.getItem("marriageGameAutoSave");
    if (savedState) {
      const {
        players: savedPlayers,
        games: savedGames,
        startGame: savedGameState,
        lastSaved: savedTimestamp,
      } = JSON.parse(savedState);

      // Only restore if there's actually saved data
      if (savedPlayers?.length > 0 || savedGames?.length > 0) {
        setPlayers(savedPlayers);
        setGames(savedGames);
        setStartGame(savedGameState);
        setLastSaved(savedTimestamp);
      }
    }
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

  // First, modify the handleSaveGame function to include total points:
  const handleSaveGame = () => {
    if (!saveGameName.trim()) {
      setError("Please enter a name for your saved game");
      return;
    }

    // Calculate total points for each player
    const playerTotals = {};
    players.forEach((player) => {
      playerTotals[player.id] = games.reduce(
        (sum, game) => sum + (game.scores[player.id] || 0),
        0
      );
    });

    const gameData = {
      id: Date.now(),
      name: saveGameName,
      date: (() => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = String(now.getFullYear()).slice(2);
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      })(),
      players,
      games,
      startGame,
      playerTotals, // Add the total points
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
    localStorage.removeItem("marriageGameAutoSave");
    localStorage.removeItem("currentGameId"); // Add this line
    setGameId(null);
    setShareUrl("");
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
    setLastSaved(null);
  };

  const addPlayer = () => {
    if (players.length < 8) {
      // Add new player with ID based on current length + 1
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
      // Remove the player and resequence the IDs
      const updatedPlayers = players
        .filter((player) => player.id !== idToRemove)
        .map((player, index) => ({
          ...player,
          id: index + 1, // Resequence IDs starting from 1
        }));
      setPlayers(updatedPlayers);
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
          // If player is becoming unseen and is the selected winner, clear winner
          if (!newJokerSeen && selectedWinner === playerId) {
            setSelectedWinner(null);
          }
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

  const calculateScores = () => {
    setIsCalculating(true);
    if (!selectedWinner) {
      setError("Please select a winner first!");
      return;
    }

    // Calculate total maal (sum of points from seen players only)
    const totalMaal = players.reduce((sum, player) => {
      return player.jokerSeen ? sum + player.points : sum;
    }, 0);

    const numPlayers = players.length;

    const scores = players.map((player) => {
      let calculatedScore;
      if (player.id === selectedWinner) {
        // Calculate winner's points based on other players' scores
        const nonWinnerPoints = players
          .filter((p) => p.id !== selectedWinner)
          .map((p) => {
            if (!p.jokerSeen) {
              return -totalMaal - 10;
            } else {
              return p.points * numPlayers - totalMaal - 3;
            }
          });
        calculatedScore = -nonWinnerPoints.reduce(
          (sum, points) => sum + points,
          0
        );
      } else if (!player.jokerSeen) {
        calculatedScore = -totalMaal - 10;
      } else {
        calculatedScore = player.points * numPlayers - totalMaal - 3;
      }

      return {
        id: player.id,
        name: player.name,
        currentPoints: player.points,
        calculatedScore,
        jokerSeen: player.jokerSeen,
        isWinner: player.id === selectedWinner,
      };
    });

    setCalculatedScores([...scores, { totalMaal }]);
  };

  // Modify your submitScores function to be async
  const submitScores = async () => {
    if (!selectedWinner) {
      setError("Please select a winner first!");
      return;
    }

    if (isSubmitting) {
      setError("Please wait until the scores are processed.");
      return;
    }

    setIsSubmitting(true);

    try {
      const playersWithRoundPoints = players.map((player) => ({
        ...player,
        roundPoints: player.points,
      }));

      // Calculate total maal
      const totalMaal = playersWithRoundPoints.reduce((sum, player) => {
        return player.jokerSeen ? sum + player.points : sum;
      }, 0);

      const numPlayers = playersWithRoundPoints.length;

      // Calculate points for non-winner players
      let nonWinnerPoints = [];
      playersWithRoundPoints.forEach((p) => {
        if (p.id !== selectedWinner) {
          let points;
          if (!p.jokerSeen) {
            points = -totalMaal - 10;
          } else {
            points = p.points * numPlayers - totalMaal - 3;
          }
          nonWinnerPoints.push(points);
        }
      });

      // Winner's points
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

      // Update Supabase
      if (gameId) {
        const { error } = await supabase
          .from("games")
          .update({
            players: updatedPlayers,
            games: updatedGames,
            last_update: new Date().toISOString(),
          })
          .eq("id", gameId);

        if (error) {
          console.error("Error updating game:", error);
          setError("Failed to update game");
          setIsSubmitting(false);
          return;
        }
      }

      setGames(updatedGames);
      localStorage.setItem("marriageGameHistory", JSON.stringify(updatedGames));

      // Reset for next round
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
    } catch (err) {
      console.error("Error in submitScores:", err);
      setError("An error occurred while submitting scores");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setError("Failed to copy link");
    }
  };

  //dismiss round
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

  //delete saved game
  const deleteSavedGame = (gameId) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this saved game?"
    );

    if (isConfirmed) {
      const updatedSavedGames = savedGamesMetadata.filter(
        (game) => game.id !== gameId
      );

      // Update localStorage
      localStorage.setItem("savedGames", JSON.stringify(updatedSavedGames));

      // Update state
      setSavedGamesMetadata(updatedSavedGames);
    }
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-blue-100"
      }`}
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
        {!startGame ? (
          <>
            <div className="relative font-mono min-h-screen bg-slate-800 text-white p-3 pt-14">
              <h1
                className="text-6xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-500 bg-clip-text text-transparent animate-scanline mb-8"
                style={{
                  textShadow: "0 0 10px rgba(234, 179, 8, 0.1)",
                  WebkitBackgroundClip: "text",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s linear infinite",
                }}
              >
                Marriage <br /> Point <br />
                Calculator
              </h1>
              <style>{`
            @keyframes shimmer {
              0% {
                background-position: 200% 0;
              }
              100% {
                background-position: -200% 0;
              }
            }
           `}</style>

              <div className="border border-green-500 p-6">
                <h2 className="text-xl mb-6 animate-pulse">Add Players</h2>

                <div className="space-y-4">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 justify-between"
                    >
                      <span className="opacity-70">[Player {player.id}]</span>
                      <input
                        type="text"
                        id={`player${player.id}`}
                        value={player.name}
                        onChange={(e) =>
                          handleNameChange(player.id, e.target.value)
                        }
                        placeholder="ENTER NAME"
                        className="flex-1 bg-neutral-950 border border-green-500 p-2 text-green-500 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                      />
                      {players.length > 1 && (
                        <button
                          onClick={() => removePlayer(player.id)}
                          className="px-3 py-1 text-red-500 hover:text-red-400 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-4">
                  {players.length < 8 && (
                    <button
                      onClick={addPlayer}
                      className="w-full px-4 py-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> ADD PLAYER
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
                    disabled={
                      players.length < 2 || players.some((p) => !p.name)
                    }
                    className="w-full px-4 py-2 border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Play size={18} /> START GAME
                  </button>
                </div>
              </div>
              {savedGamesMetadata.length > 0 && (
                <div
                  className={`mt-4 p-4 border ${
                    darkMode ? "border-gray-700" : "border-neutral-400"
                  }`}
                >
                  <h3 className="font-semibold pb-2 pl-2">Saved Games</h3>
                  <div className="space-y-2">
                    {savedGamesMetadata.map((game) => (
                      <div
                        key={game.id}
                        className="flex flex-col justify-between p-2 border-b border-neutral-400"
                      >
                        <div className="text-sm  flex justify-between items-center pb-2">
                          <span className="text-base">{game.name}</span>
                          <span className="opacity-80">{game.date}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-sm w-full pr-3">
                            {Object.entries(game.playerTotals || {}).map(
                              ([playerId, total]) => {
                                const player = game.players.find(
                                  (p) => p.id === parseInt(playerId)
                                );
                                return player ? (
                                  <div key={playerId}>
                                    <div className="flex justify-between pr-4 border border-neutral-500">
                                      <div className="flex flex-col">
                                        {player.name}
                                      </div>

                                      <span
                                        className={
                                          total >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }
                                      >
                                        {total}
                                      </span>
                                    </div>
                                  </div>
                                ) : null;
                              }
                            )}
                          </div>
                          <div className="flex flex-col gap-3 text-sm">
                            <button
                              onClick={() => loadSavedGame(game)}
                              className="px-4 py-2 border border-blue-500 text-white hover:bg-blue-600"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => deleteSavedGame(game.id)}
                              className="px-4 py-2 border border-red-500 text-white hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-between pb-16  lg:p-6 rounded-xl lg:shadow-sm bg-blue-100">
            {games.length < 1 && (
              <div className="p-4 mb-6">
                <div className="p-4 bg-white rounded-lg py-8">
                  <h2 className="text-lg mb-4 font-mono">*** INSTRUCTIONS</h2>
                  <div className="space-y-4 text-sm">
                    <p>
                      1. Mark players who have seen their cards using the{" "}
                      <EyeOff size={14} className="inline text-red-600" />{" "}
                      button
                    </p>
                    <p>
                      2. For players who have seen their cards, enter their
                      points
                    </p>
                    <p>
                      3. Select the winner using the{" "}
                      <Trophy size={14} className="inline text-green-600" />{" "}
                      button
                    </p>
                    <p>
                      4. Click{" "}
                      <button
                        className="bg-green-600 p-2 rounded-lg text-white font-semibold"
                        disabled
                      >
                        Submit Scores
                      </button>{" "}
                      button to calculate and record the scores
                    </p>
                    <p>
                      5. To dismiss a round, press the{" "}
                      <X size={17} className="inline text-red-700" />
                    </p>
                    <p>
                      6. To save the game locally, press the{" "}
                      <Save size={17} className="inline" />
                    </p>
                    <p>
                      7. To share the scoreboard, click the{" "}
                      <Share2 className="inline" size={18} />
                    </p>
                    <p className="text-xs mt-4 ">
                      Note: Players must see their cards before being selected
                      as winner
                    </p>
                  </div>
                </div>
              </div>
            )}
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
            <div className="space-y-4">
              <div className="flex flex-col gap-2 ">
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
                    <div
                      className={`font-semibold rounded-lg flex items-end text-sm overflow-x-hidden text-ellipsis ${
                        selectedWinner === player.id
                          ? "bg-green-500 text-neutral-50"
                          : "bg-blue-200"
                      } text-neutral-800 p-2 w-[90px] max-w-[90px]`}
                    >
                      <User size={20} />

                      <span className="">{player.name.toUpperCase()}</span>
                    </div>

                    <div className="flex gap-2 max-sm:w-30">
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
                            className={`w-12 text-xl text-center px-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                              darkMode
                                ? "bg-gray-800 border-gray-700 text-white"
                                : "bg-white border-gray-200"
                            }`}
                            aria-placeholder="enter points"
                          />
                        </>
                      )}
                      <button
                        onClick={() => handleJokerSeen(player.id)}
                        className={`w-full px-2 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ease-in-out flex items-center justify-center gap-2 ${
                          darkMode
                            ? player.jokerSeen
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-red-900 bg-opacity-20 text-red-300 hover:bg-opacity-30"
                            : player.jokerSeen
                            ? "bg-blue-500 text-white "
                            : "text-blue-500 bg-white "
                        }`}
                      >
                        {player.jokerSeen ? (
                          <>
                            <div className="flex flex-col items-center">
                              <Eye size={18} />
                              Seen
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col items-center">
                              <EyeOff size={18} />
                              <s>Seen</s>
                            </div>
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
                            ? "bg-white text-green-600"
                            : "bg-white text-green-600 cursor-not-allowed"
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
              </div>
            </div>
            <div className="flex justify-center gap-4 py-4">
              <button
                onClick={submitScores}
                disabled={isSubmitting || !selectedWinner}
                className={`px-4 py-2 text-white rounded-lg font-medium transition-colors duration-200 ${
                  isSubmitting || !selectedWinner
                    ? "bg-neutral-800 text-white cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-300 drop-shadow-lg"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit Scores"}
              </button>
            </div>
            {games.length > 0 && (
              <div
                className={`mb-8 transition-colors duration-200 ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white lg:shadow-sm border-gray-200"
                } lg:rounded-xl overflow-hidden`}
              >
                <div
                  className={`flex justify-between text-xl font-semibold px-4 py-2 border-b ${
                    darkMode
                      ? "bg-gray-900 border-gray-700"
                      : "bg-neutral-900 text-white border-neutral-800"
                  }`}
                >
                  <h2 className="flex items-end font-bold text-2xl">
                    Game Logs
                  </h2>
                </div>
                {/* Replace the existing table with this updated version */}
                <div className="overflow-x-auto" ref={scoreboardRef}>
                  <table className="w-full text-sm border-collapse bg-neutral-200">
                    <thead>
                      <tr className="bg-neutral-900 border border-black text-white">
                        <th className="text-center font-normal py-4">No.</th>
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
                      {/* Totals row at the top */}
                      <tr className="bg-gray-50 font-bold border-neutral-400">
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

                      {/* Game records in reverse order */}
                      {[...games].reverse().map((game) => (
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
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {startGame && gameId && (
              <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
                <h2 className="text-xl mb-4">Share Live Scoreboard</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        setError("Link copied to clipboard!");
                        setTimeout(() => setError(""), 2000);
                      } catch (err) {
                        setError("Failed to copy link");
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            )}

            {/* Add this fixed bottom navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 text-white border-t border-neutral-800">
              <div className="max-w-6xl flex justify-evenly items-center p-3">
                <button
                  onClick={shareScoreboard}
                  className="px-4 py-2 hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Share Scoreboard"
                >
                  <Share2 size={20} strokeWidth={2} />
                </button>

                <button
                  onClick={() => {
                    if (window.confirm("Do you want to start new game? ")) {
                      resetGame();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-full transition-colors"
                >
                  <House size={20} strokeWidth={2} />
                  <span className="hidden sm:inline">Home</span>
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="px-4 py-2 hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Save Game"
                >
                  <Save size={20} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Add padding at the bottom of the main content to prevent overlap */}
            <div className="pb-20"></div>
          </div>
        )}
      </div>
    </div>
  );
}
