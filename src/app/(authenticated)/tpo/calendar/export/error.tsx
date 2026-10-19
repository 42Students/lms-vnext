"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load upcoming round export"
    description="No empty calendar or export is inferred after a failed read."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
