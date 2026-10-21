"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";
import { Banner } from "@/components/ui/banner";
import { PageHeader } from "@/components/ui/page-header";

/** GR-20: route-specific fallback that keeps a retry visible. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Placement Analytics"/>
    <Banner tone="warning" role="alert">
      Couldn&apos;t refresh hiring metrics. The requested hiring data could not be verified.
      This fallback does not display stale or zero-filled figures from another scope.
    </Banner>
    <GracefulErrorBoundary error={error} reset={reset}/>
  </div>;
}
