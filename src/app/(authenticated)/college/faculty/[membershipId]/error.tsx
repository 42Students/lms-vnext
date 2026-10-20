"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { PageBackLink } from "@/components/ui/page-back-link";
export default function FacultyDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4">
    <PageBackLink href="/college/faculty" label="Back to faculty" />
    <ErrorState title="Faculty record unavailable"
    description="The teaching record could not be loaded. This does not mean no assignments exist."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>} />
  </div>;
}
