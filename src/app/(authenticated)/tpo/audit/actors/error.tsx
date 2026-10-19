"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load actor audit"
    description="Recorded activity could not be retrieved; no zero count is inferred."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
