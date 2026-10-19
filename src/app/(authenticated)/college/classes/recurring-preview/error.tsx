"use client";
import { ErrorState } from "@/components/ui/error-state";
import {Button} from "@/components/ui/button";
export default function RecurringPreviewError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <ErrorState title="Recurring preview unavailable"
    description="The schedule source could not be checked. No zero-conflict result is assumed."
    action={<Button variant="secondary" type="button" onClick={reset}
      >Retry</Button>} />;
}
