"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load joining follow-ups"
    description="The report is unavailable; this is not evidence of completed joinings."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
