"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="\n        Unable to load your profile\n      "
    description="Your own TPO membership information could not be\n        retrieved. No account details are inferred from\n        this failure."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
