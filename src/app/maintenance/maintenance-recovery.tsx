"use client";

import { useState } from "react";
import { GracefulScreen } from "@/components/public/graceful-screen";

/** UX-G068: user-initiated recovery only; no timed reload or backend health assumption. */
export function MaintenanceRecovery() {
  const [feedback, setFeedback] = useState("");

  function checkAgain() {
    if (!navigator.onLine) {
      setFeedback("You're offline. Reconnect to the internet before checking again.");
      return;
    }
    // Fixed same-origin destination. The dashboard applies existing session,
    // role, maintenance and tenant guards; it is not an authorization bypass.
    window.location.assign("/dashboard");
  }

  return (
    <>
      <GracefulScreen
        title="42LMS is temporarily unavailable"
        message={feedback || "We're carrying out maintenance. Try again to see whether your workspace is available, or return to sign in."}
        homeHref="/login"
        homeLabel="Return to sign in"
        retry={checkAgain}
      />
      <span role="status" aria-live="polite" className="sr-only">{feedback}</span>
    </>
  );
}
