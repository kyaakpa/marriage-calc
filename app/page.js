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
  Copy,
} from "lucide-react";
import { supabase } from "./lib/supabase";

export default function Home() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [heldPlayers, setHeldPlayers] = useState(new Set());
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
  const [showNewPlayerModal, setShowNewPlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");

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

  // Remove or modify the auto-save useEffect to prevent duplicate saves
  useEffect(() => {
    const saveState = () => {
      // Skip saving if there's no data to save or no unsaved changes
      if (!players.length || !games.length || !hasUnsavedChanges) return;

      const gameState = {
        players,
        games,
        startGame,
        lastSaved: new Date().toISOString(),
      };

      // Save to autoSave in localStorage
      localStorage.setItem("marriageGameAutoSave", JSON.stringify(gameState));
      setLastSaved(new Date().toISOString());
    };

    // Save whenever these states change
    const autoSaveTimer = setTimeout(saveState, 1000);

    return () => clearTimeout(autoSaveTimer);
  }, [players, games, startGame, hasUnsavedChanges]);

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

  //service worker disabled
  // useEffect(() => {
  //   if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  //     // Register service worker
  //     navigator.serviceWorker
  //       .register("/service-worker.js")
  //       .then((registration) => {
  //         // Check for updates
  //         registration.addEventListener("updatefound", () => {
  //           const newWorker = registration.installing;
  //           newWorker.addEventListener("statechange", () => {
  //             if (
  //               newWorker.state === "installed" &&
  //               navigator.serviceWorker.controller
  //             ) {
  //               // New version available
  //               if (
  //                 window.confirm("New version available! Reload to update?")
  //               ) {
  //                 window.location.reload();
  //               }
  //             }
  //           });
  //         });
  //       })
  //       .catch((error) => {
  //         console.error("Service Worker registration failed:", error);
  //       });

  //     // Handle updates when the service worker is already active
  //     navigator.serviceWorker.addEventListener("controllerchange", () => {
  //       window.location.reload();
  //     });
  //   }
  // }, []);

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
  const togglePlayerHold = (playerId) => {
    setHeldPlayers((prev) => {
      const newHeld = new Set(prev);
      if (newHeld.has(playerId)) {
        newHeld.delete(playerId);
      } else {
        newHeld.add(playerId);
      }
      return newHeld;
    });

    // If player is being held, reset their state
    if (!heldPlayers.has(playerId)) {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === playerId) {
            return {
              ...p,
              points: 0,
              jokerSeen: false,
              isWinner: false,
              roundPoints: 0,
            };
          }
          return p;
        })
      );

      // If this player was the selected winner, clear it
      if (selectedWinner === playerId) {
        setSelectedWinner(null);
      }
    }
  };

  const convertDateStringToDate = (dateString) => {
    // Expected format: "DD/MM/YY HH:mm:ss"
    const [datePart, timePart] = dateString.split(" ");
    const [day, month, year] = datePart.split("/");
    const [hours, minutes, seconds] = timePart.split(":");

    // Note: Months are 0-based in JavaScript Date
    return new Date(
      2000 + parseInt(year), // Convert YY to YYYY
      parseInt(month) - 1, // Subtract 1 from month
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    );
  };

  useEffect(() => {
    const savedGames = localStorage.getItem("savedGames");

    if (savedGames) {
      // Parse and sort the games by date in descending order
      const games = JSON.parse(savedGames);
      const sortedGames = games.sort((a, b) => {
        // Convert date strings to Date objects for comparison
        const dateA = convertDateStringToDate(a.date);
        const dateB = convertDateStringToDate(b.date);
        return dateB - dateA; // Sort in descending order (newest first)
      });
      setSavedGamesMetadata(sortedGames);
    }
  }, []);

  // First, modify the handleSaveGame function to include total points:
  const handleSaveGame = async () => {
    if (!saveGameName.trim()) {
      setError("Please enter a name for your saved game");
      return;
    }

    try {
      // Create new game ID for Supabase
      const supabaseId = crypto.randomUUID();

      // Create game in Supabase
      const { error: supabaseError } = await supabase.from("games").insert({
        id: supabaseId,
        players,
        games,
        last_update: new Date().toISOString(),
      });

      if (supabaseError) {
        console.error("Supabase Error:", supabaseError);
        setError("Failed to save game to server");
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

      const now = new Date();
      const formattedDate = `${String(now.getDate()).padStart(2, "0")}/${String(
        now.getMonth() + 1
      ).padStart(2, "0")}/${String(now.getFullYear()).slice(2)} ${String(
        now.getHours()
      ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
        now.getSeconds()
      ).padStart(2, "0")}`;

      const gameData = {
        id: Date.now(),
        supabaseId, // Store the Supabase ID
        name: saveGameName,
        date: formattedDate,
        players,
        games,
        startGame,
        playerTotals,
      };

      const existingSavedGames = JSON.parse(
        localStorage.getItem("savedGames") || "[]"
      );
      const updatedSavedGames = [...existingSavedGames, gameData].sort(
        (a, b) => {
          const dateA = convertDateStringToDate(a.date);
          const dateB = convertDateStringToDate(b.date);
          return dateB - dateA;
        }
      );

      localStorage.setItem("savedGames", JSON.stringify(updatedSavedGames));
      setSavedGamesMetadata(updatedSavedGames);
      setHasUnsavedChanges(false);

      setSaveGameName("");
      setShowSaveModal(false);
      setError("Game saved successfully!");
      setTimeout(() => setError(""), 2000);
    } catch (err) {
      console.error("Error in handleSaveGame:", err);
      setError("Failed to save game");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleAddNewPlayer = () => {
    if (!newPlayerName.trim()) {
      setError("Please enter a player name");
      return;
    }

    // Generate new player ID
    const newPlayerId = Math.max(...players.map((p) => p.id)) + 1;

    // Create new player object
    const newPlayer = {
      id: newPlayerId,
      name: newPlayerName.trim(),
      points: 0,
      isWinner: false,
      jokerSeen: false,
      roundPoints: 0,
    };

    // Update existing games to include the new player with 0 scores
    const updatedGames = games.map((game) => ({
      ...game,
      scores: {
        ...game.scores,
        [newPlayerId]: 0,
      },
      roundPoints: {
        ...game.roundPoints,
        [newPlayerId]: 0,
      },
    }));

    // Update players array
    const updatedPlayers = [...players, newPlayer];

    // Update state
    setPlayers(updatedPlayers);
    setGames(updatedGames);
    setNewPlayerName("");
    setShowNewPlayerModal(false);

    // Update localStorage
    localStorage.setItem("marriageGameHistory", JSON.stringify(updatedGames));
    localStorage.setItem("marriageGamePlayers", JSON.stringify(updatedPlayers));
  };

  const loadSavedGame = async (gameData) => {
    try {
      // Create new game ID for the loaded game
      const newGameId = crypto.randomUUID();

      // Create game in Supabase
      const { error: supabaseError } = await supabase.from("games").insert({
        id: newGameId,
        players: gameData.players,
        games: gameData.games,
        last_update: new Date().toISOString(),
      });

      if (supabaseError) {
        console.error("Supabase Error:", supabaseError);
        throw new Error(`Failed to create game: ${supabaseError.message}`);
      }

      // Save the original game's ID and data
      localStorage.setItem(
        "originalGameData",
        JSON.stringify({
          id: gameData.id,
          name: gameData.name,
          date: gameData.date,
        })
      );

      // Update local state AFTER successful Supabase insert
      setGameId(newGameId);
      setPlayers(gameData.players);
      setGames(gameData.games);
      setStartGame(gameData.startGame);

      // Set the share URL with the clean ID
      setShareUrl(
        `${window.location.origin}/watch/${encodeURIComponent(newGameId)}`
      );

      // Save to localStorage
      localStorage.setItem("currentGameId", newGameId);
      localStorage.setItem(
        "marriageGamePlayers",
        JSON.stringify(gameData.players)
      );
      localStorage.setItem(
        "marriageGameHistory",
        JSON.stringify(gameData.games)
      );
      localStorage.setItem(
        "marriageGameState",
        JSON.stringify(gameData.startGame)
      );

      console.log("Game successfully loaded and synced");
    } catch (err) {
      console.error("LoadSavedGame Error:", err);
      setError("Failed to sync game with live scoreboard");
      setTimeout(() => setError(""), 3000);
    }
  };
  const shareScoreboard = async () => {
    if (!scoreboardRef.current) return;

    try {
      const html2canvas = (await import("html2canvas")).default;

      // Add a temporary background to ensure the image isn't transparent
      const originalBg = scoreboardRef.current.style.background;
      scoreboardRef.current.style.background = "#ffffff";

      const canvas = await html2canvas(scoreboardRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Restore original background
      scoreboardRef.current.style.background = originalBg;

      // Convert canvas to blob
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );
      const file = new File([blob], "marriage-game-scores.png", {
        type: "image/png",
      });

      // Try native sharing first
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Marriage Card Game Scores",
            files: [file],
          });
          return;
        } catch (err) {
          console.log("Native sharing failed, falling back to download", err);
        }
      }

      // Fallback to download if native sharing isn't available or fails
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "marriage-game-scores.png";
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
      setError("Failed to generate image");
      setTimeout(() => setError(""), 2000);
    }
  };

  const resetGame = async () => {
    // Auto-save the current game before resetting
    if (games.length > 0 && hasUnsavedChanges) {
      const now = new Date();
      const formattedDate = `${String(now.getDate()).padStart(2, "0")}/${String(
        now.getMonth() + 1
      ).padStart(2, "0")}/${String(now.getFullYear()).slice(2)} ${String(
        now.getHours()
      ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
        now.getSeconds()
      ).padStart(2, "0")}`;

      // Calculate total points for each player
      const playerTotals = {};
      players.forEach((player) => {
        playerTotals[player.id] = games.reduce(
          (sum, game) => sum + (game.scores[player.id] || 0),
          0
        );
      });

      // Get existing saved games
      const existingSavedGames = JSON.parse(
        localStorage.getItem("savedGames") || "[]"
      );

      // Check if this was a loaded game
      const originalGameData = localStorage.getItem("originalGameData");
      let gameToUpdate;

      if (originalGameData) {
        // If this was a loaded game, find the original game
        const { id } = JSON.parse(originalGameData);
        gameToUpdate = existingSavedGames.find((game) => game.id === id);
      }

      if (gameToUpdate) {
        // Update existing game instead of creating new one
        const updatedGames = existingSavedGames.map((game) =>
          game.id === gameToUpdate.id
            ? {
                ...game,
                players,
                games,
                playerTotals,
                last_update: new Date().toISOString(),
              }
            : game
        );
        localStorage.setItem("savedGames", JSON.stringify(updatedGames));
        setSavedGamesMetadata(updatedGames);
      } else if (hasUnsavedChanges) {
        // Only create new save if it wasn't a loaded game
        const gameData = {
          id: Date.now(),
          name: `Game ${formattedDate}`,
          date: formattedDate,
          players,
          games,
          startGame,
          playerTotals,
        };
        const updatedSavedGames = [...existingSavedGames, gameData];
        localStorage.setItem("savedGames", JSON.stringify(updatedSavedGames));
        setSavedGamesMetadata(updatedSavedGames);
      }
    }

    // Clean up all game state
    localStorage.removeItem("marriageGamePlayers");
    localStorage.removeItem("marriageGameHistory");
    localStorage.removeItem("marriageGameState");
    localStorage.removeItem("marriageGameAutoSave");
    localStorage.removeItem("currentGameId");
    localStorage.removeItem("originalGameData"); // Clear the original game data
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
    setHasUnsavedChanges(false);
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
      // Filter out held players from score calculation
      const activePlayers = players.filter((p) => !heldPlayers.has(p.id));

      // Create a copy of the players with their current points stored as roundPoints
      const playersWithRoundPoints = activePlayers.map((player) => ({
        ...player,
        roundPoints: player.points, // Store the current points as roundPoints
      }));

      // Calculate total maal only for active players
      const totalMaal = playersWithRoundPoints.reduce((sum, player) => {
        return player.jokerSeen ? sum + player.points : sum;
      }, 0);

      const numPlayers = playersWithRoundPoints.length;

      // Calculate points for non-winner active players
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

      // Create scores object including held players (with 0 points)
      const roundScores = players.reduce((acc, player) => {
        if (heldPlayers.has(player.id)) {
          acc[player.id] = 0;
        } else if (player.id === selectedWinner) {
          acc[player.id] = winnerPoints;
        } else if (!player.jokerSeen) {
          acc[player.id] = -totalMaal - 10;
        } else {
          acc[player.id] = player.points * numPlayers - totalMaal - 3;
        }
        return acc;
      }, {});

      // Create roundPoints object - this captures the ORIGINAL points before calculation
      const roundPointsObj = players.reduce((acc, player) => {
        // Store the original points entered by the user, not 0 for non-held players
        acc[player.id] = heldPlayers.has(player.id) ? 0 : player.points;
        return acc;
      }, {});

      const updatedGames = [
        ...games,
        {
          gameNo: games.length + 1,
          scores: roundScores,
          roundPoints: roundPointsObj,
          winner: selectedWinner,
        },
      ];

      // Update Supabase if gameId exists
      if (gameId) {
        try {
          const { error: supabaseError } = await supabase
            .from("games")
            .update({
              players: players,
              games: updatedGames,
              last_update: new Date().toISOString(),
            })
            .eq("id", gameId);

          if (supabaseError) {
            console.error("Error updating game:", supabaseError);
            setError("Failed to update game");
            setIsSubmitting(false);
            return;
          }
        } catch (err) {
          console.error("Error updating game:", err);
          setError("Failed to update game");
          setIsSubmitting(false);
          return;
        }
      }

      setGames(updatedGames);
      localStorage.setItem("marriageGameHistory", JSON.stringify(updatedGames));
      setHasUnsavedChanges(true);

      // Reset for next round, maintaining hold status
      setPlayers(
        players.map((player) => ({
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
  const deleteSavedGame = async (gameId) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this saved game?"
    );

    if (isConfirmed) {
      try {
        // Find the game data in savedGamesMetadata
        const gameToDelete = savedGamesMetadata.find(
          (game) => game.id === gameId
        );

        // If the game exists and has a Supabase ID, delete it from Supabase
        if (gameToDelete && gameToDelete.supabaseId) {
          const { error } = await supabase
            .from("games")
            .delete()
            .eq("id", gameToDelete.supabaseId);

          if (error) {
            console.error("Error deleting game from Supabase:", error);
            setError("Failed to delete game from server");
            return;
          }
        }

        // Update local storage and state
        const updatedSavedGames = savedGamesMetadata.filter(
          (game) => game.id !== gameId
        );

        localStorage.setItem("savedGames", JSON.stringify(updatedSavedGames));
        setSavedGamesMetadata(updatedSavedGames);
      } catch (err) {
        console.error("Error in deleteSavedGame:", err);
        setError("Failed to delete game");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-green-700"
      }`}
    >
      {typeof window !== "undefined" && showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div
            className={`bg-green-700 text-white p-6 max-w-md w-full ${
              darkMode ? "bg-gray-800" : ""
            }`}
          >
            <h3 className="text-lg font-semibold mb-4">Save Game</h3>
            <input
              type="text"
              value={saveGameName}
              onChange={(e) => setSaveGameName(e.target.value)}
              placeholder="Enter a name for your saved game"
              className={`w-full p-2 border mb-4 text-black tracking-wide`}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-white text-red-500 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGame}
                className="px-4 py-2 bg-white text-green-700 font-bold hover:bg-green-600"
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
            <div className="relative min-h-screen bg-green-700 p-3 pt-14 overflow-x-hidden">
              <h1 className="text-6xl font-bold text-white mb-8">
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

              <div className="p-6 shadow-inner shadow-green-800 text-yellow-50">
                <h2 className="text-xl  mb-6 font-bold">Add Players</h2>

                <div className="space-y-4">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 justify-between"
                    >
                      <span className=" font-semibold tracking-wider w-20">
                        Player {player.id}
                      </span>
                      <input
                        type="text"
                        id={`player${player.id}`}
                        value={player.name}
                        onChange={(e) =>
                          handleNameChange(player.id, e.target.value)
                        }
                        placeholder="Enter name"
                        className="min-[412px]:flex-1 p-[6px] bg-transparent placeholder:text-neutral-50  tracking-wider shadow-inner shadow-green-900"
                      />
                      {players.length > 1 && (
                        <button
                          onClick={() => removePlayer(player.id)}
                          className="p-2 text-rose-500 bg-green-900 rounded-full"
                        >
                          <X size={20} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-4">
                  {players.length < 8 && (
                    <button
                      onClick={addPlayer}
                      className="w-full px-4 py-2 bg-green-600 shadow-md text-white font-semibold  flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Add a player
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
                    className="w-full px-4 py-2 text-neutral-50 font-semibold shadow bg-green-600 disabled:bg-green-600 disabled:opacity-50 disabled:shadow-inner disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Play size={18} /> Start game
                  </button>
                </div>
              </div>

              {savedGamesMetadata.length > 0 && (
                <>
                  <div className="relative border-t-2 min-w-full overflow-x-hidden -mx-4 mt-8" />
                  <div className={`mt-4 p-2 text-white`}>
                    <h3 className="font-bold pb-2 pl-2 text-xl">Saved Games</h3>
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
                                      <div className="flex justify-between pr-4 border border-[#DDD700] bg-[#1b344eb0] items-center">
                                        <div className="flex flex-col pl-2 py-1 text-[#F5F5F5] ">
                                          {player.name}
                                        </div>

                                        <span
                                          className={
                                            total >= 0
                                              ? "text-green-500"
                                              : "text-red-500"
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
                            <div className="flex flex-col gap-3 text-sm tracking-wide">
                              <button
                                onClick={() => loadSavedGame(game)}
                                className="px-4 py-2 border-2 border-[#DDD700] bg-blue-600 text-white"
                              >
                                Load
                              </button>
                              <button
                                onClick={() => deleteSavedGame(game.id)}
                                className="px-4 py-2 border-2 border-[#DDD700] bg-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-between pb-16  lg:p-6 lg:shadow-sm bg-blue-50">
            {/* {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">⚠️</div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )} */}
            <div className="space-y-2">
              <div className="flex flex-col gap-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-2 md:px-3 md:pt-2 flex justify-between items-center md:rounded-xl md:border-1 md:shadow-md border-dotted ${
                      heldPlayers.has(player.id) ? "opacity-50 bg-gray-200" : ""
                    }`}
                  >
                    <div
                      className={`font-semibold py-[18px] flex-1 flex items-end text-sm overflow-x-hidden text-ellipsis ${
                        selectedWinner === player.id ? "" : "text-black"
                      }  p-2 w-[90px] max-w-[90px]`}
                    >
                      {/* <User size={20} /> */}
                      <span className="">{player.name.toUpperCase()}</span>
                    </div>

                    <div className="flex gap-2 max-sm:w-30">
                      {!heldPlayers.has(player.id) && player.jokerSeen && (
                        <input
                          id={`points-input-${player.id}`}
                          type="number"
                          inputMode="numeric"
                          placeholder="0"
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
                          className="w-12 text-xl rounded-lg text-center px-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-neutral-800 border-gray-200"
                          aria-placeholder="enter points"
                        />
                      )}

                      {!heldPlayers.has(player.id) && (
                        <>
                          <button
                            onClick={() => handleJokerSeen(player.id)}
                            className={`w-full px-2 py-2 text-sm font-medium transition-colors duration-300 ease-in-out flex items-center justify-center gap-2 rounded-lg ${
                              darkMode
                                ? player.jokerSeen
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-red-900 bg-opacity-20 text-red-300 hover:bg-opacity-30"
                                : player.jokerSeen
                                ? "bg-blue-500 text-neutral-50"
                                : "bg-red-600 text-neutral-50"
                            }`}
                          >
                            {player.jokerSeen ? (
                              <div className="flex flex-col items-center">
                                <Eye size={18} />
                                Seen
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <EyeOff size={18} />
                                <s>Seen</s>
                              </div>
                            )}
                          </button>
                          <button
                            onClick={() => handleWinnerSelect(player.id)}
                            disabled={!player.jokerSeen}
                            className={`w-[100px] px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center justify-center rounded-lg gap-1 ${
                              player.id === selectedWinner
                                ? "bg-green-600 text-neutral-50"
                                : player.jokerSeen
                                ? "bg-red-600 text-neutral-50"
                                : "opacity-80 cursor-not-allowed bg-red-600 text-neutral-50"
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
                        </>
                      )}

                      <button
                        onClick={() => togglePlayerHold(player.id)}
                        className={`px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center justify-center rounded-lg ${
                          heldPlayers.has(player.id)
                            ? "bg-neutral-400"
                            : "bg-red-600 text-red-50"
                        }`}
                      >
                        {heldPlayers.has(player.id) ? "Resume" : "Hold"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-4 py-4 px-2">
              <button
                onClick={() => setShowNewPlayerModal(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium transition-colors duration-200 hover:bg-blue-700"
              >
                Add Player
              </button>
              <button
                onClick={submitScores}
                disabled={isSubmitting || !selectedWinner}
                className={`px-4 py-2 text-white font-medium transition-colors rounded-lg duration-200 ${
                  isSubmitting || !selectedWinner
                    ? "bg-green-700 opacity-60 cursor-not-allowed shadow-inner shadow-green-800"
                    : "bg-green-700"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit Scores"}
              </button>
            </div>
            {games.length < 1 && (
              <div className="p-4 mb-6 font-semibold">
                <div className="p-4 bg-green-800 shadow-inner shadow-green-900 text-neutral-200 py-8">
                  <h2 className="text-lg mb-4 tracking-wide font-bold">
                    *** INSTRUCTIONS
                  </h2>
                  <div className="space-y-4 text-sm">
                    <p>
                      1. Mark players who have seen their cards using the{" "}
                      <EyeOff size={14} className="inline" /> button
                    </p>
                    <p>
                      2. For players who have seen their cards, enter their
                      points
                    </p>
                    <p>
                      3. Select the winner using the{" "}
                      <Trophy size={14} className="inline" /> button
                    </p>
                    <p>
                      4. Click{" "}
                      <button
                        className="bg-green-600 p-2 text-white font-semibold"
                        disabled
                      >
                        Submit Scores
                      </button>{" "}
                      button to record the scores
                    </p>
                    <p>
                      5. To dismiss a round, press the{" "}
                      <X size={17} className="inline" />
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
            {showNewPlayerModal && (
              <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
                <div
                  className={`bg-green-700 text-white p-6 max-w-md w-full ${
                    darkMode ? "bg-gray-800" : ""
                  }`}
                >
                  <h3 className="text-lg font-semibold mb-4">Add New Player</h3>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter player name"
                    className="w-full p-2 border mb-4 text-black tracking-wide"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowNewPlayerModal(false);
                        setNewPlayerName("");
                      }}
                      className="px-4 py-2 bg-white text-red-500 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNewPlayer}
                      className="px-4 py-2 bg-white text-green-700 font-bold hover:bg-green-600"
                    >
                      Add Player
                    </button>
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

            {startGame && gameId && games.length > 0 && (
              <div className="mb-6 p-4  border-t-4 text-yellow-50">
                <h2 className="text-xl mb-4 font-bold ">
                  Share Live Scoreboard
                </h2>
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="px-3 py-2 border border-gray-300 bg-transparent flex-1 "
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
                    className="p-2 h-[41.8px] bg-green-600 text-white "
                  >
                    <Copy className="inline" /> Copy Link
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
