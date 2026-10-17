"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";

/** GR-11: global-error must render html/body in the App Router. */
export default function GlobalError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body><GracefulErrorBoundary error={error} reset={reset} /></body>
    </html>
  );
}
