"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";
import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";

/** GR-20: route-specific fallback that keeps a retry visible. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Hiring Dashboard" />
    <Banner tone="warning">Couldn't refresh hiring metrics. Retry to load the selected filters; no zero-count conclusion is assumed.</Banner>
    <GracefulErrorBoundary error={error} reset={reset} homeHref="/college/hiring-dashboard" insideShell />
  </div>;
}
