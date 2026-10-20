"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load drive shortlist"
    description="The persisted screening shortlist could not be retrieved. This is not evidence of zero shortlisted applicants. Use Retry to load the current view."
    action={<Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>}
  />;
}
