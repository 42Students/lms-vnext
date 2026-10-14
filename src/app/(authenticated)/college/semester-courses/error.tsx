"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function SemesterCoursesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Course mappings unavailable"
    description="The mapping source could not be loaded. No zero-value conclusion is assumed."
    action={<button type="button" onClick={reset} className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Retry</button>} />;
}
