"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="\n        Couldn't load drive shortlist\n      "
    description="The persisted screening shortlist could not be retrieved. This is not\n        evidence of zero shortlisted applicants. Use Retry to load the current view."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
