"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";

/** Keep the authenticated shell and protect any private invitation details. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 max-w-full">
    <GracefulErrorBoundary error={error} reset={reset} homeHref="/dashboard" insideShell />
  </div>;
}
