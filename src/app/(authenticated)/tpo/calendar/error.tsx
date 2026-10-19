"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="\n        Couldn't load the placement calendar\n      "
    description="Calendar events could not be retrieved. No event\n        count or empty state is inferred from this failure."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
