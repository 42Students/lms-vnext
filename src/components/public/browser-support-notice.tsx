"use client";

/**
 * GR-23: old browsers should see guidance instead of a blank app.
 * Usage: <BrowserSupportNotice /> in the root layout.
 */
import { useEffect, useState } from "react";

export function BrowserSupportNotice() {
  const [unsupported, setUnsupported] = useState(false);
  useEffect(() => {
    const check = () => setUnsupported(
      typeof window.fetch !== "function" ||
      typeof window.Promise !== "function" ||
      typeof window.URL !== "function" ||
      !window.CSS?.supports?.("display", "grid"),
    );
    const timer = setTimeout(check, 0);
    return () => clearTimeout(timer);
  }, []);
  if (!unsupported) return null;
  return <p role="alert" className="border-b border-warning bg-warning-subtle p-4 text-center text-sm font-medium text-foreground">
    This browser is not supported. Please update your browser and try again.
  </p>;
}
