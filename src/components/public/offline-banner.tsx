"use client";

/**
 * GR-16: global connection notice. Usage: <OfflineBanner /> in root layout.
 * State is driven by connection events, not an endless polling spinner.
 */
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    const initial = setTimeout(update, 0);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      clearTimeout(initial);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="alert" className="sticky top-0 z-50 border-b border-warning bg-warning-subtle px-4 py-3 text-center text-sm font-medium text-foreground shadow-[var(--lms-header-shadow)]">
      You appear to be offline. Check your connection and try again.
    </div>
  );
}
