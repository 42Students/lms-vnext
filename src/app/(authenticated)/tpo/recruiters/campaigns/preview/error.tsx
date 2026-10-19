"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Audience preview unavailable"
    description="No delivery assumptions can be made from this failure."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
