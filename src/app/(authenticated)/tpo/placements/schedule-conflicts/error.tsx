"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load round schedule conflicts"
    description="Data could not be retrieved; no zero count or conflict-free conclusion can be inferred from this failure."
    action={<Button type="button" onClick={reset} className="w-full sm:w-auto">Retry</Button>}
  />;
}
