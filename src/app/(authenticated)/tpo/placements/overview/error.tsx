"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";

/** GR-20: Placement overview keeps Retry and a role-safe return link on failure. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GracefulErrorBoundary error={error} reset={reset} homeHref="/tpo/placements" />;
}
