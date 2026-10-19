"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function CollegePlacementCalendarError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState
    title="Couldn't load placement interviews"
    description="College placement rounds could not be retrieved. A failed read does not mean there are no interviews."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
