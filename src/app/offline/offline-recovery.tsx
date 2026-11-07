"use client";

import { useEffect, useState } from "react";
import { GracefulScreen } from "@/components/public/graceful-screen";

/**
 * Public recovery only: browser connectivity is a hint, never proof the LMS is
 * reachable. Do not auto-reload (which traps offline visitors in a loop).
 * The authenticated dashboard is the safe role-aware landing after reconnect.
 */
export function OfflineRecovery() {
  const [connection, setConnection] = useState<"unknown" | "offline" | "online">("unknown");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    // Sync after hydration; never read navigator during server rendering.
    setConnection(navigator.onLine ? "online" : "offline");
    const onOffline = () => {
      setConnection("offline");
      setFeedback("The connection was lost. Reconnect before trying again.");
    };
    const onOnline = () => {
      setConnection("online");
      setFeedback("Your browser reports a connection. Try again to open your workspace.");
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  function retry() {
    if (!navigator.onLine) {
      setConnection("offline");
      setFeedback("Still offline. Check Wi-Fi or mobile data, then try again.");
      return;
    }
    setFeedback("Opening your workspace…");
    // This is a fixed same-origin path: no untrusted returnTo or cross-origin
    // URL can be introduced by an offline bookmark.
    window.location.assign("/dashboard");
  }

  const online = connection === "online";
  const message = feedback.startsWith("Still offline")
    ? feedback
    : online
      ? "Your browser reports a connection. Try again to open your workspace."
      : "Check your internet connection. When it is restored, try again or return to sign in.";

  return (
    <>
      <GracefulScreen
        title={online ? "Ready to reconnect" : "You're offline"}
        message={message}
        homeHref="/login"
        homeLabel="Return to sign in"
        retry={retry}
      />
      <span className="sr-only" role="status" aria-live="polite">{feedback}</span>
    </>
  );
}
