"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="\n        Unable to load More\n      "
    description="The TPO navigation page could not be loaded.\n        Existing sidebar destinations remain available."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
