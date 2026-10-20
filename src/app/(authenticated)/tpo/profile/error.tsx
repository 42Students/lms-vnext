"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Unable to load your profile"
    description="Your own TPO membership information could not be retrieved. No account details are inferred from this failure."
    action={<Button type="button" onClick={reset} className="w-full sm:w-auto">Retry</Button>}
  />;
}
