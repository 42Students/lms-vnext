"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="\n        Couldn't load Messages\n      "
    description="College-scoped communication records could not be\n        retrieved. This error does not establish that the\n        college has no recruiter conversations or notifications."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
