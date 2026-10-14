"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function CollegeAcademicsError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <ErrorState title="Academic structure unavailable"
    description="Academic periods, programs or sections could not be loaded. No empty-result conclusion is assumed."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold">Retry</button>} />;
}
