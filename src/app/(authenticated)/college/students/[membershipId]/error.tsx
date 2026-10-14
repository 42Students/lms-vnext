"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function CollegeStudentDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Student record unavailable"
    description="The record could not be loaded. This does not mean the student has no records."
    action={<button type="button" onClick={reset} className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold">Retry</button>} />;
}
