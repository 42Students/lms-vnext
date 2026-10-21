"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    {safeHref ? <a href={safeHref} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-3 text-[14px] font-[650] leading-5 text-[var(--lms-link-text)] underline underline-offset-2 transition-colors duration-[var(--lms-motion-fast)] motion-reduce:transition-none hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:shadow-[0_0_0_4px_rgba(26,149,161,0.12)]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="mr-2 size-4 shrink-0"><rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3"/></svg>{label}</a> :
      <span role="alert" className="text-[13px] leading-[22px] text-[var(--lms-body-text)]">This link is unavailable.</span>}
    {safeHref ? <span className="flex flex-wrap gap-3">
      <Button variant="link" size="sm" type="button" onClick={() => { setCopyStatus("");setShowFallback(value=>!value); }}
        aria-expanded={showFallback}
        className="min-h-11 md:min-h-[var(--lms-control-height)] px-2 text-[14px] font-[650] underline! hover:underline! focus-visible:underline! underline-offset-2 hover:bg-[var(--lms-primary-subtle)] aria-expanded:bg-[var(--lms-primary-subtle)] aria-expanded:text-[var(--lms-primary-text)]">
        {showFallback ? "Hide link" : "Show link to copy"}
      </Button>
      <Button variant="link" size="sm" type="button" onClick={() => void copyLink()}
        className="min-h-11 md:min-h-[var(--lms-control-height)] px-2 text-[14px] font-[650] underline! hover:underline! focus-visible:underline! underline-offset-2 hover:bg-[var(--lms-primary-subtle)]">
        Copy link
      </Button>
    </span> : null}
    {showFallback && safeHref ? <span role="status" className="min-w-0 space-y-[var(--lms-space-2)] text-[13px] leading-[22px] text-[var(--lms-body-text)]">
      <span className="block">The link could not be opened. Copy the destination below to try another browser.</span>
      <span className="block select-text break-all">{safeHref}</span>
      {copyStatus ? <span className="block" aria-live="polite">{copyStatus}</span> : null}
    </span> : null}
  </span>;
}
