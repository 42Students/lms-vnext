"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Round scheduling could not load"
    description="The schedule is unavailable, not empty."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
