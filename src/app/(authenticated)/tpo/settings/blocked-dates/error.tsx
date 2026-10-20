"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="Blocked dates could not be loaded."
      description="The recorded blocked dates could not be retrieved. Retry to load them."
      action={<Button variant="secondary" type="button" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>}
    />
  );
}
