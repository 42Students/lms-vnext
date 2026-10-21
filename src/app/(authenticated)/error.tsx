"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";

/** A failed authenticated subtree is different from a public /500.
 * Preserve workspace navigation on recoverable child-route failures;
 * root/global failures use the anonymous GracefulScreen without user data. */
export default function AuthenticatedError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GracefulErrorBoundary error={error} reset={reset} legacyWorkspaceCopy insideShell />;
}
