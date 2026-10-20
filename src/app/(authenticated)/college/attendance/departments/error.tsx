"use client";
import { Button } from "@/components/ui/button";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeDepartmentAttendanceError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Department attendance unavailable"
    description="The attendance evidence could not be loaded. No zero-value conclusion is assumed."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>} />;
}
