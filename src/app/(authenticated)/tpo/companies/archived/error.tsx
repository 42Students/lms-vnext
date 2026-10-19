"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load archived relationships"
    description="The database could not be read. No empty list is inferred."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
