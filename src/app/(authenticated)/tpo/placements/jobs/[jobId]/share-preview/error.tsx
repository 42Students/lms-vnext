"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load shortlist sharing preview"
    description="Failed records are not interpreted as an empty shortlist. Please retry."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
