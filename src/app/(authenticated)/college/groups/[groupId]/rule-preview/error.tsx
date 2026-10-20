"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function CollegeGroupRulePreviewError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Rule preview failed"
    description="The read-only rule preview could not be computed. No changes were made."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>} />;
}
