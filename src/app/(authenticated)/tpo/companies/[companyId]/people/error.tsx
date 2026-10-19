"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Contact people could not be loaded"
    description="The contact list is unavailable; this is not an empty list."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
