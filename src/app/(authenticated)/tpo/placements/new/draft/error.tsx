"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load draft drive setup"
    description="Employer and season options could not be loaded. No empty selection is assumed."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
