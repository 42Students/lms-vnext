"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";

/** Legacy bookmark handoff does not expose raw route or authorization errors. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 max-w-full"><GracefulErrorBoundary error={error} reset={reset} homeHref="/admin/academics" insideShell /></div>;
}
