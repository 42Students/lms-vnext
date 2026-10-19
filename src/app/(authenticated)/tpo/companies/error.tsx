"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="\n        Couldn't load companies\n      "
    description="The company directory could not be retrieved.\n        No company, lead, drive or offer count is inferred\n        from this failure."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
