"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function RecurringPreviewError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <ErrorState title="Recurring preview unavailable"
    description="The schedule source could not be checked. No zero-conflict result is assumed."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Retry</button>} />;
}
