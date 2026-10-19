"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load closure consequences"
    description="No close action was applied by this failed read."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
