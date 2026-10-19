"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load emails"
    description="Receipt history could not be read; this is not evidence of zero sends."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
