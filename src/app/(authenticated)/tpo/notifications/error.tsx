"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Could not load this page"
    description="We couldn't load your notifications. This is a read error, not evidence that you have none."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
