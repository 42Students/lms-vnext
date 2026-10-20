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

export function GracefulErrorBoundary({ error, reset, homeHref = "/dashboard", legacyWorkspaceCopy = false, insideShell = false }: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
  legacyWorkspaceCopy?: boolean;
  insideShell?: boolean;
}) {
  const [requestId, setRequestId] = useState<string | null>(null);
  const stale = isStaleChunkError(error);

  useEffect(() => {
    const id = createRequestId();
    // Chat-16 accepts UUID report IDs; the visible 8-digit reference remains searchable.
    const reportId = `00000000-0000-4000-8000-0000${id}`;
    const timer = setTimeout(() => setRequestId(id), 0);
    const kind = stale ? "stale_chunk" : "render";
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
    return <section role="alert" className="min-w-0 space-y-5">
      <PageHeader title={title} />
      <p className="text-sm text-body">{message}</p>
      {reference ? <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{reference}</span>
        <Button type="button" variant="ghost" size="sm"
          onClick={() => { if (requestId) void navigator.clipboard?.writeText(requestId).catch(() => {}); }}>
          Copy reference
        </Button>
      </div> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={reset}>Try again</Button>
        <Link href={homeHref}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Go to home
        </Link>
      </div>
    </section>;
  }

  return <GracefulScreen title={title} message={message} retry={reset}
    homeHref={homeHref} requestId={requestId} />;
}
