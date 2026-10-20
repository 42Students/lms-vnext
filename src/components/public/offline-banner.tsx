"use client";

/**
 * GR-16: global connection notice. Usage: <OfflineBanner /> in root layout.
 * State is driven by connection events, not an endless polling spinner.
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function OfflineBanner() {
  const pathname = usePathname();
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
  // The dedicated offline screen already gives this recovery instruction.
  if (!offline || pathname === "/offline") return null;
  return (
    <div role="alert" className="sticky top-0 z-50 border-b border-warning bg-warning-subtle px-4 py-3 text-center text-sm font-medium text-foreground shadow-[var(--lms-header-shadow)]">
      You appear to be offline. Check your connection and try again.
    </div>
  );
}
