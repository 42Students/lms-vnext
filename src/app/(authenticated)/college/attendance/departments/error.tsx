"use client";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeDepartmentAttendanceError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Department attendance unavailable"
    description="The attendance evidence could not be loaded. No zero-value conclusion is assumed."
    action={<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center"><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><ButtonLink variant="secondary" href="/college/attendance" className="min-h-11 w-full sm:w-auto">Back to attendance</ButtonLink></div>} />;
}
