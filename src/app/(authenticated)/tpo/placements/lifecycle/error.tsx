"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load drive lifecycle"
    description="A failed read is not evidence that there are no drives."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
