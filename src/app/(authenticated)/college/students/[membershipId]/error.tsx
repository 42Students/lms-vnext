"use client";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function CollegeStudentDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Student record" />
    <ErrorState title="Student record unavailable"
      description="The record could not be loaded. This does not mean the student has no records."
      action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>} />
  </div>;
}
