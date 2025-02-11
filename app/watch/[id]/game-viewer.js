"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";

export default function GameViewer({ id }) {
  const [gameData, setGameData] = useState(null);
  const params = useParams();
  const id = params?.id;
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);

  const fetchGameData = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setError("Game not found");
        return;
      }

      setGameData(data);
      setLastUpdate(new Date().toLocaleTimeString());
      setUpdateCount((prev) => prev + 1);
    } catch (err) {
      setError("Failed to fetch game data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchGameData();
  };

  useEffect(() => {
    if (!id) return;

    // Initial fetch
    fetchGameData();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`game_${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setGameData(payload.new);
          setLastUpdate(new Date().toLocaleTimeString());
          setUpdateCount((prev) => prev + 1);

          // Show refresh animation
          setIsRefreshing(true);
          setTimeout(() => setIsRefreshing(false), 1000);
        }
      )
      .subscribe();

    // Polling as backup (every 5 seconds)
    const pollInterval = setInterval(fetchGameData, 5000);

    return () => {
      subscription.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading game data...</p>
        </div>
      </div>
    );
  }

  const { players, games } = gameData;

  const calculateTotals = () => {
    return players.map((player) => ({
      ...player,
      total: games.reduce(
        (sum, game) => sum + (game.scores[player.id] || 0),
        0
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with enhanced status */}
        <div className="bg-white rounded-t-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              Live Scoreboard
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-full transition-colors ${
                  isRefreshing ? "bg-gray-100" : "hover:bg-gray-100"
                }`}
                title="Refresh scores"
              >
                <RefreshCw
                  className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
              <div className="flex flex-col items-end text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRefreshing
                        ? "bg-green-500 animate-pulse"
                        : "bg-green-500"
                    }`}
                  />
                  <span className="text-gray-600">Live</span>
                </div>

                {updateCount > 0 && (
                  <span className="text-gray-500 text-xs">
                    {updateCount} updates received
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status bar for recent updates */}
        {isRefreshing && (
          <div className="bg-green-50 text-green-700 px-4 py-2 text-sm border-x border-green-100">
            Refreshing scores...
          </div>
        )}

        {/* Current Scores */}
        <div className="bg-white shadow-sm border border-t-0 border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">Current Standings</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left border border-gray-200 font-medium">
                    Player
                  </th>
                  <th className="p-2 text-right border border-gray-200 font-medium">
                    Total
                  </th>
                  <th className="p-2 text-right border border-gray-200 font-medium">
                    Last Round
                  </th>
                </tr>
              </thead>
              <tbody>
                {calculateTotals().map((player) => (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="p-2 border border-gray-200">
                      {player.name}
                    </td>
                    <td className="p-2 text-right border border-gray-200">
                      <span
                        className={
                          player.total >= 0 ? "text-green-500" : "text-red-500"
                        }
                      >
                        {player.total}
                      </span>
                    </td>
                    <td className="p-2 text-right border border-gray-200">
                      {games.length > 0 &&
                        games[games.length - 1].scores[player.id]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Game History */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">Game History</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-center border border-gray-200">
                    Round
                  </th>
                  {players.map((player) => (
                    <th
                      key={player.id}
                      className="p-2 text-center border border-gray-200"
                    >
                      {player.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...games].reverse().map((game) => (
                  <tr key={game.gameNo} className="hover:bg-gray-50">
                    <td className="p-2 text-center border border-gray-200">
                      {game.gameNo}
                    </td>
                    {players.map((player) => (
                      <td
                        key={player.id}
                        className={`p-2 text-center border border-gray-200 ${
                          game.winner === player.id ? "bg-green-50" : ""
                        }`}
                      >
                        {game.scores[player.id]}
                        <sup className="text-xs text-gray-500 ml-1">
                          {game.roundPoints[player.id]}
                        </sup>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
