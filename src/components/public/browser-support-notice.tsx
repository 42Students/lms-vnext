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
  return <div role="alert" className="w-full min-w-0 border-b border-warning-border bg-warning-subtle px-4 py-3 text-[13px] leading-5 text-body">
    <p className="mx-auto max-w-3xl break-words text-center">
      This browser is not supported. Please update your browser and try again.
    </p>
  </div>;
}
