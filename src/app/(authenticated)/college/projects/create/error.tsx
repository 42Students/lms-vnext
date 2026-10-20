"use client";
import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <GracefulErrorBoundary error={error} reset={reset} insideShell />;
}
