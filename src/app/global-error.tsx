"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";

/** GR-11: global-error must render html/body in the App Router.
 * Unlike legacy /500.js, this is a root-render exception boundary, not a
 * generic HTTP 500 status endpoint. The authenticated segment's error.tsx
 * deliberately retains the role shell; this root fallback does not.
 * Server-generated HTTP 500 responses are not automatically re-rendered here
 * unless an exception crosses the App Router's root error boundary.
 */
export default function GlobalError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body><GracefulErrorBoundary error={error} reset={reset} homeHref="/" /></body>
    </html>
  );
}
