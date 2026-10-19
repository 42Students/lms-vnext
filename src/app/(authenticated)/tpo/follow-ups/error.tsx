"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="\n        Couldn't load recruiter follow-ups\n      "
    description="Follow-up data could not be retrieved. Missing data is not treated as zero."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
