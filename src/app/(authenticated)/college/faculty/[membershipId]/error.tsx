"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function FacultyDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Faculty record unavailable"
    description="The teaching record could not be loaded. This does not mean no assignments exist."
    action={<button type="button" onClick={reset} className="min-h-10 rounded-md border border-border px-4 font-semibold">Retry</button>} />;
}
