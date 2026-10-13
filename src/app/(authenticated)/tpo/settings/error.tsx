"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function TpoSettingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load placement settings"
      description="The college settings could not be retrieved. No fallback has been substituted for a database read failure."
      action={
        <Button
          variant="secondary"
          onClick={reset}
        >
          Retry
        </Button>
      }
    />
  );
}
