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
    <div role="alert" className="sticky top-0 z-50 min-w-0 break-words border-b border-warning bg-warning-subtle px-4 py-2.5 text-left text-sm font-medium leading-5 text-foreground sm:text-center">
      You're offline. Reconnect to the internet, then try again. Your current screen has not been cleared.
    </div>
  );
}
