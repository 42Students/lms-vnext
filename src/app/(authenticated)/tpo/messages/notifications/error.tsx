"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load my placement notifications"
    description="Delivery records could not be retrieved. A failure is not an empty inbox."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
