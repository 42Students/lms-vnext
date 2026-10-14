"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Drive overview unavailable" description="Could not load persisted drive data. Counts have not been replaced with zero."
    action={<button type="button" onClick={reset}>Retry</button>} />;
}
