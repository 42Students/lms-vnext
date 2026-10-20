"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";

/** Keep the existing private error report and recovery actions on the shared canvas. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GracefulErrorBoundary error={error} reset={reset} homeHref="/hr/home" insideShell />;
}
