"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function CollegeGroupRulePreviewError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Rule preview failed"
    description="The read-only rule preview could not be computed. No changes were made."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Retry</button>} />;
}
