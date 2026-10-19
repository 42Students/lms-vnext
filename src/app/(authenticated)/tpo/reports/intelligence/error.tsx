"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load performance intelligence"
    description="Report facts could not be retrieved. Missing data is not interpreted as zero."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
