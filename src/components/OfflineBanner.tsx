"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    setIsOffline(!navigator.onLine);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-900/90 border-b-2 border-amber-600 text-amber-100 text-xs font-serif font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-md animate-fade-scale">
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>You&apos;re offline — changes will sync once connection is restored</span>
    </div>
  );
}
