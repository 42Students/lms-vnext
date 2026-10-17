"use client";

/**
 * GR-56: if a link cannot open, show the exact URL for the user to copy.
 * Usage: <ThirdPartyLink href={meetingUrl} label="Join meeting" />
 * Only http/https destinations are permitted.
 */
import { useState } from "react";

export function ThirdPartyLink({ href, label }: { href: string; label: string }) {
  const [failed, setFailed] = useState(false);
  const open = () => {
    try {
      const target = new URL(href);
      if (!["https:", "http:"].includes(target.protocol)) { setFailed(true); return; }
      const popup = window.open(target.href, "_blank", "noopener,noreferrer");
      if (!popup) setFailed(true);
    } catch { setFailed(true); }
  };
  return (
    <span className="inline-flex min-w-0 flex-col gap-2">
      <button type="button" onClick={open}
        className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text underline focus-visible:ring-2 focus-visible:ring-[var(--lms-focus-ring)]">
        {label}
      </button>
      {failed && <span role="status" className="min-w-0 break-all text-sm text-muted-foreground">
        The link could not be opened. Copy and paste it into your browser: {href}
        <button type="button" className="ml-2 underline"
          onClick={() => { void navigator.clipboard?.writeText(href).catch(() => {}); }}>
          Copy link
        </button>
      </span>}
    </span>
  );
}
