"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="\n        Couldn't load round schedule conflicts\n      "
    description="Data could not be retrieved; no zero count or conflict-free conclusion\n        can be inferred from this failure."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
