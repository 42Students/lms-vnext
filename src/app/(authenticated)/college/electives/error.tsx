"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function CollegeElectivesError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Electives unavailable"
    description="Elective records could not be loaded. No empty-result conclusion is assumed."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>} />;
}
