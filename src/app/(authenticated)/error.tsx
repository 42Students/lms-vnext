"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";

/** GR-11: authenticated workspace fallback with Retry and a home link. */
export default function AuthenticatedError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GracefulErrorBoundary error={error} reset={reset} legacyWorkspaceCopy />;
}
