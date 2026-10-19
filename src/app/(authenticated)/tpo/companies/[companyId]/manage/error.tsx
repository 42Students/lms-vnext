"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load company relationship"
    description="No saved state can be inferred from this error."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
