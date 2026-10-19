"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="\n        Couldn't load the contact log\n      "
    description="The activity records could not be retrieved. No empty history is assumed."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
