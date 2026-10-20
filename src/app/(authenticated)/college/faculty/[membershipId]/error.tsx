"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function FacultyDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Faculty record unavailable"
    description="The teaching record could not be loaded. This does not mean no assignments exist."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>} />;
}
