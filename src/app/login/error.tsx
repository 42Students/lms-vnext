"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";

/** Sign-in errors use the same full-screen branded recovery shell. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GracefulErrorBoundary error={error} reset={reset} homeHref="/login" />;
}
