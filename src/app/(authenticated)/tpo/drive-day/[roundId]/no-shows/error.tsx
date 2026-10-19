"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="\n        Couldn't load Drive Day no-show report\n      "
    description="The records could not be retrieved. No missing record or zero count is inferred."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
