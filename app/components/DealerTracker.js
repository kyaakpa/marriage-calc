import React, { useState, useEffect } from "react";
import { RotateCcw, User } from "lucide-react";

const DealerTracker = ({ players, darkMode, showDealerModal }) => {
  const [currentDealerIndex, setCurrentDealerIndex] = useState(0);
  const [dealHistory, setDealHistory] = useState([]);
  const [closeModal, setCloseModal] = useState(showDealerModal);

  useEffect(() => {
    // Only load saved state if there are players
    if (players && players.length > 0) {
      const savedDealerIndex = localStorage.getItem("currentDealer");
      const savedDealHistory = localStorage.getItem("dealHistory");

      if (savedDealerIndex !== null) {
        // Ensure the index is within bounds of current players array
        const parsedIndex = parseInt(savedDealerIndex);
        if (parsedIndex < players.length) {
          setCurrentDealerIndex(parsedIndex);
        } else {
          setCurrentDealerIndex(0);
        }
      }

      if (savedDealHistory) {
        setDealHistory(JSON.parse(savedDealHistory));
      }
    }
  }, [players]);

  const nextDealer = () => {
    if (!players || players.length === 0) return;

    const newIndex = (currentDealerIndex + 1) % players.length;
    setCurrentDealerIndex(newIndex);

    const currentDealer = players[currentDealerIndex];
    if (currentDealer && currentDealer.name) {
      const newHistory = [
        ...dealHistory,
        {
          dealer: currentDealer.name,
          timestamp: new Date().toLocaleTimeString(),
        },
      ];

      setDealHistory(newHistory);
      localStorage.setItem("currentDealer", newIndex.toString());
      localStorage.setItem("dealHistory", JSON.stringify(newHistory));
    }
  };

  const resetDealer = () => {
    setCurrentDealerIndex(0);
    setDealHistory([]);
    localStorage.removeItem("currentDealer");
    localStorage.removeItem("dealHistory");
  };

  // If there are no players, don't render the component
  if (!players || players.length === 0) {
    return null;
  }

  // Get current dealer safely
  const currentDealer = players[currentDealerIndex];
  const dealerName = currentDealer ? currentDealer.name : "Unknown";

  return (
    <div
      className={`mt-8 p-4 ${
        darkMode ? "bg-gray-800" : "bg-white"
      } rounded-xl lg:shadow-sm`}
    >
      <div
        className={`p-4 rounded-xl ${
          darkMode ? "bg-gray-700" : "bg-neutral-50"
        }`}
      >
        <div className="flex justify-between items-center">
          <div>
            <div
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Current Dealer
            </div>
            <button
              className="bg-black text-white"
              onClick={() => setCloseModal(true)}
            >
              X
            </button>
            <div
              className={`text-xl font-bold flex items-center gap-2 ${
                darkMode ? "text-white" : "text-black"
              }`}
            >
              <User size={20} />
              {dealerName}
            </div>
          </div>
          <button
            onClick={nextDealer}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              darkMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Next Dealer
          </button>
        </div>
      </div>

      {dealHistory.length > 0 && (
        <div className="mt-4">
          <h3
            className={`text-sm font-medium mb-2 ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Recent Deals
          </h3>
          <div className="max-h-32 overflow-y-auto">
            {dealHistory
              .slice(-5)
              .reverse()
              .map((deal, index) => (
                <div
                  key={index}
                  className={`py-2 flex justify-between ${
                    index !== 0 ? "border-t" : ""
                  } ${
                    darkMode
                      ? "border-gray-700 text-gray-300"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  <span>{deal.dealer}</span>
                  <span className="opacity-60">{deal.timestamp}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerTracker;
