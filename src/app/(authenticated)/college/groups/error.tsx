"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function CollegeGroupsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState
    title="Student groups unavailable"
    description="The student-group list could not be loaded. This does not mean the college has no groups."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>}
  />;
}
