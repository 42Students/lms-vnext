"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";

/** GR-20: route-specific fallback that keeps a retry visible. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GracefulErrorBoundary insideShell homeHref="/admin/placements/drives" error={error} reset={reset} />;
}
