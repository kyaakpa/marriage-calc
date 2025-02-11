// app/watch/[id]/page.js
import { Suspense } from "react";
import GameViewer from "./game-viewer";
import { RefreshCw } from "lucide-react";

function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading game data...</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <GameViewer />
    </Suspense>
  );
}
