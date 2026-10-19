"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function Error({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState
    title="Unable to load task review history"
    description="The read failed; missing data cannot be assumed from this error."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
