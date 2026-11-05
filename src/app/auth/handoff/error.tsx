"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";
import { PageHeader } from "@/components/ui/page-header";

/** GR-20: route-specific fallback that keeps a retry visible. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <main className="mx-auto max-w-xl space-y-4 px-4 py-8">
    <PageHeader title="This sign-in link may have expired" />
    <p className="text-sm text-[var(--lms-body-text)]">For your security, sign-in links work only once. Start a new sign-in from your college or platform login page.</p>
    <GracefulErrorBoundary error={error} reset={reset} homeHref="/?auth=handoff-retired" />
  </main>;
}
