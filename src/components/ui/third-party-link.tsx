"use client";

import { useState } from "react";

/** WebView-safe external navigation with a user-selectable, copyable fallback.
 * Clipboard failures never hide the original validated HTTPS URL. */
export function ThirdPartyLink({ href, label, ariaLabel }: { href: string; label: string; ariaLabel?: string }) {
  const [showFallback, setShowFallback] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  let safeHref: string | null = null;
  try {
    // URL() silently strips raw tabs/newlines and interprets backslashes as
    // slashes for HTTPS. Never turn an ambiguous supplied string into a link.
    if (href !== href.trim() || /[\\\x00-\x1f\x7f]/.test(href)) {
      throw new Error("Ambiguous external destination");
    }
    const url = new URL(href);
    if (url.protocol === "https:" && !url.username && !url.password) safeHref = url.href;
  } catch { /* Invalid destinations are never made clickable. */ }

  async function copyLink() {
    if (!safeHref) return;
    setShowFallback(true);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(safeHref);
      setCopyStatus("Link copied. You can open it in another browser.");
    } catch {
      setCopyStatus("Copy the link displayed below and open it in another browser.");
    }
  }

  return <span className="inline-flex min-w-0 flex-col gap-[var(--lms-space-2)]">
    {safeHref ? <a href={safeHref} aria-label={ariaLabel} className="inline-flex min-h-11 sm:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-3 text-[13px] font-semibold leading-5 text-[var(--lms-link-text)] underline underline-offset-2 transition-colors duration-[var(--lms-motion-fast)] motion-reduce:transition-none hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">{label}</a> :
      <span role="alert" className="text-[13px] leading-5 text-[var(--lms-body-text)]">This link is unavailable.</span>}
    {safeHref ? <span className="block select-text break-all text-[12px] leading-[18px] text-[var(--lms-muted-text)]" aria-label="Destination URL">{safeHref}</span> : null}
    {safeHref ? <span className="flex flex-wrap gap-3">
      <button type="button" onClick={() => { setCopyStatus("");setShowFallback(value=>!value); }}
        aria-expanded={showFallback}
        className="inline-flex min-h-11 sm:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] px-2 text-[13px] font-semibold leading-5 text-[var(--lms-link-text)] underline underline-offset-2 transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] motion-reduce:transition-none">
        {showFallback ? "Hide link" : "Show link to copy"}
      </button>
      <button type="button" onClick={() => void copyLink()}
        className="inline-flex min-h-11 sm:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] px-2 text-[13px] font-semibold leading-5 text-[var(--lms-link-text)] underline hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        Copy link
      </button>
    </span> : null}
    {showFallback && safeHref ? <span role="status" className="min-w-0 space-y-[var(--lms-space-2)] text-[13px] leading-5 text-[var(--lms-body-text)]">
      <span className="block">The link could not be opened. Copy the destination below to try another browser.</span>
      <span className="block select-text break-all">{safeHref}</span>
      {copyStatus ? <span className="block" aria-live="polite">{copyStatus}</span> : null}
    </span> : null}
  </span>;
}
