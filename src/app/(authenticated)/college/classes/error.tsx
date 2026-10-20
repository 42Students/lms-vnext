"use client";
import { Button } from "@/components/ui/button";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeClassesError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Classes unavailable"
    description="Class records could not be loaded. No empty-result conclusion is assumed."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>} />;
}
