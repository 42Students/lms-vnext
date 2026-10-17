"use client";

/**
 * GR-11/12/21: used by both root and authenticated error.tsx boundaries.
 * Logs only a short reference and non-sensitive category; never displays
 * exception text, the Next digest or a provider response to a customer.
 */
import { useEffect, useState } from "react";
import { GracefulScreen } from "@/components/public/graceful-screen";
import { createRequestId } from "@/lib/request-id";

export function isStaleChunkError(error: Error): boolean {
  return /ChunkLoadError|Loading chunk failed|Failed to fetch dynamically imported module|Importing a module script failed/i
    .test(error.message);
}

export function GracefulErrorBoundary({ error, reset, homeHref = "/dashboard" }: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
}) {
  const [requestId, setRequestId] = useState<string | null>(null);
  const stale = isStaleChunkError(error);

  useEffect(() => {
    const id = createRequestId();
    const timer = setTimeout(() => setRequestId(id), 0);
    const kind = stale ? "stale_chunk" : "render";
    void fetch("/api/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, kind }),
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

  return <GracefulScreen
    title={stale ? "Updating your page" : "This page is temporarily unavailable"}
    message={stale ? "A new version is available, reloading..." :
      "Something went wrong on our side. Please try again in a moment."}
    retry={reset}
    homeHref={homeHref}
    requestId={requestId}
  />;
}
