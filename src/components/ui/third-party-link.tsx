"use client";

import { useState } from "react";

/** WebView-safe external navigation: same tab plus a visible fallback URL. */
export function ThirdPartyLink({ href, label }: { href: string; label: string }) {
  const [showFallback, setShowFallback] = useState(false);
  let safeHref: string | null = null;
  try { const url = new URL(href); if (url.protocol === "http:" || url.protocol === "https:") safeHref = url.href; } catch { /* Invalid destination handled inline. */ }
  return <span className="inline-flex min-w-0 flex-col gap-2">
    {safeHref ? <a href={safeHref} className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">{label}</a> :
      <span role="alert" className="text-sm text-foreground">This link is unavailable.</span>}
    {safeHref ? <button type="button" onClick={() => setShowFallback(current => !current)}
      className="inline-flex min-h-11 items-center text-sm text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-[var(--lms-teal-deep)]">
      {showFallback ? "Hide link" : "Show link to copy"}
    </button> : null}
    {showFallback && safeHref ? <span role="status" className="min-w-0 select-text break-all text-sm text-body">{safeHref}</span> : null}
  </span>;
}
