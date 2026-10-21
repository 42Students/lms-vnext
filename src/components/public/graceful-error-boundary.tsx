"use client";

/**
 * GR-11/12/21: used by both root and authenticated error.tsx boundaries.
 * Logs only a short reference and non-sensitive category; never displays
 * exception text, the Next digest or a provider response to a customer.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { friendlyReference } from "@/lib/friendly-error";
import { GracefulScreen } from "@/components/public/graceful-screen";
import { createRequestId } from "@/lib/request-id";

export function isStaleChunkError(error: Error): boolean {
  return /ChunkLoadError|Loading chunk failed|Failed to fetch dynamically imported module|Importing a module script failed/i
    .test(error.message);
}

export function GracefulErrorBoundary({ error, reset, homeHref = "/dashboard", legacyWorkspaceCopy = false, insideShell = false, showHeader = true }: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
  legacyWorkspaceCopy?: boolean;
  insideShell?: boolean;
  showHeader?: boolean;
}) {
  const [requestId, setRequestId] = useState<string | null>(null);
  const stale = isStaleChunkError(error);

  useEffect(() => {
    const id = createRequestId();
    // Chat-16 accepts UUID report IDs; the visible 8-digit reference remains searchable.
    const reportId = `00000000-0000-4000-8000-0000${id}`;
    const timer = setTimeout(() => setRequestId(id), 0);
    const kind = stale ? "stale_chunk" : /(?:Auth|Session|Unauthorized)/i.test(error.name) ? "auth_lost" : "render";
    void fetch("/api/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "A page could not be displayed.",
        name: stale ? "ChunkLoadError" : "RenderFailure",
        component: "GracefulErrorBoundary",
        event: kind,
        path: window.location.pathname.slice(0, 255),
        requestId: reportId,
      }),
      keepalive: true,
    }).catch(() => { /* The fallback must work without a connection. */ });

    if (stale) {
      try {
        const key = `lms:chunk-reloaded:${window.location.pathname}`;
        if (sessionStorage.getItem(key) !== "yes") {
          sessionStorage.setItem(key, "yes");
          window.location.reload();
        }
      } catch { /* Stay on the fallback rather than looping. */ }
    }
    return () => clearTimeout(timer);
  }, [error, stale]);

  const title = stale ? "Updating your page" :
    legacyWorkspaceCopy ? "Something went wrong." : "This page is temporarily unavailable";
  const message = stale ? "A new version is available, reloading..." :
    legacyWorkspaceCopy ? "Please refresh the page or contact support if the problem persists." :
    "Something went wrong on our side. Please try again in a moment.";

  if (insideShell) {
    const reference = friendlyReference(requestId);
    return <section role="alert" className="min-w-0 space-y-[var(--lms-space-4)]">
      {showHeader ? <PageHeader title={title} /> : null}
      <p className="max-w-prose break-words text-sm text-body">{message}</p>
      {reference ? <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)] break-words text-xs text-muted-foreground">
        <span>{reference}</span>
        <Button type="button" variant="ghost" size="sm"
          onClick={() => { if (requestId) void navigator.clipboard?.writeText(requestId).catch(() => {}); }}>
          Copy reference
        </Button>
      </div> : null}
      <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] md:flex-row md:items-center">
        <Button type="button" className="min-h-11 w-full md:min-h-9 md:w-auto" onClick={reset}>Try again</Button>
        <Link href={homeHref}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-link md:min-h-9 md:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:underline">
          Go to home
        </Link>
      </div>
    </section>;
  }

  if(!stale) {
    // Preserve the legacy public 500 hierarchy. The signed-in workspace has
    // its own compact shell boundary, so only the root fallback uses this.
    const reference=friendlyReference(requestId);
    const safeBack=()=>{
      try{
        if(window.history.length>1&&document.referrer&&
          new URL(document.referrer).origin===window.location.origin){
          window.history.back();return;
        }
      }catch{/* The fallback must not trust a malformed referrer. */}
      window.location.assign("/");
    };
    return <main role="alert" className="flex min-h-dvh w-full min-w-0 flex-col items-center justify-center bg-[#fafbfc] p-8 text-center">
      <h1 className="m-0 text-[64px] font-extrabold leading-none text-[#1e9aa8]">500</h1>
      <h2 className="mb-2 mt-4 text-[24px] font-semibold leading-[32px] text-[#1a1d21]">Server Error</h2>
      <p className="mb-8 max-w-[420px] text-sm leading-[22px] text-[#6b7280]">
        Something went wrong on our side. Please try again in a moment.
      </p>
      <div className="flex min-w-0 flex-wrap justify-center gap-3">
        <button type="button" onClick={safeBack}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#1e9aa8] bg-white px-6 py-3 text-sm font-semibold text-[#1e9aa8] hover:bg-[#e8f7f8] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1e9aa8]">
          Go back
        </button>
        <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#1e9aa8] bg-[#1e9aa8] px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-[#178a96] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1e9aa8]">
          Go to Home
        </Link>
      </div>
      <Button type="button" variant="link" onClick={reset} className="mt-4 min-h-11 text-sm">
        Try again
      </Button>
      {reference?<p className="mt-4 break-words text-xs text-[#6b7280]">{reference}</p>:null}
    </main>;
  }
  return <GracefulScreen title={title} message={message} retry={reset}
    homeHref={homeHref} requestId={requestId} />;
}
