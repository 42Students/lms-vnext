"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Could not load this page"
    description="Unable to load batch rules."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
