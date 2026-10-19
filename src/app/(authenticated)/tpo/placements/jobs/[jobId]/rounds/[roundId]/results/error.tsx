"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load round results"
    description="A failed read does not mean a learner has no results."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
