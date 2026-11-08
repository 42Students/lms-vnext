"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";
import { PageHeader } from "@/components/ui/page-header";

/** GR-20: route-specific fallback that keeps a retry visible. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 space-y-4"><PageHeader title="Create placement drive" /><GracefulErrorBoundary error={error} reset={reset} homeHref="/college/placements" insideShell showHeader={false} /></div>;
}
