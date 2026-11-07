"use client";

import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";

/** GR-20: route-specific fallback that keeps a retry visible. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 space-y-4"><PageHeader title="Template version history" /><PageBackLink href="/admin/projects/templates" label="Back to project templates" /><GracefulErrorBoundary error={error} reset={reset} /></div>;
}
