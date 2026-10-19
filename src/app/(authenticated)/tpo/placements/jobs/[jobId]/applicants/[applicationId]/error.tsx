"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load applicant detail"
    description="A failed read does not mean the application or offer is absent."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
