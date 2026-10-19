"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function CollegeStudentDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Student record unavailable"
    description="The record could not be loaded. This does not mean the student has no records."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>} />;
}
