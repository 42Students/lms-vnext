"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="\n        Couldn't load Reports · By Branch\n      "
    description="The requested records could not be retrieved. A load failure does not\n        mean there are no records or that a reported total is zero."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
