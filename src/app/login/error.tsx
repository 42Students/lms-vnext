"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";

/** GR-20: route-specific fallback that keeps a retry visible. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <main className="mx-auto flex min-h-dvh w-full max-w-xl min-w-0 items-center px-4 py-8 sm:py-12">
    <div className="w-full"><GracefulErrorBoundary error={error} reset={reset} homeHref="/" /></div>
  </main>;
}
