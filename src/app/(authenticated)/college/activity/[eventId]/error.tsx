"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function CollegeActivityDetailError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Activity detail unavailable"
    description="The requested event cannot be shown. It may be outside the permitted college scope."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Retry</button>} />;
}
