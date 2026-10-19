"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load interview rounds"
    description="Failed retrieval is not a cleared scheduling queue."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
