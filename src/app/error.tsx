"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";

/** GR-11: root route error boundary; never displays the thrown error. */
export default function RootError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GracefulErrorBoundary error={error} reset={reset} />;
}
