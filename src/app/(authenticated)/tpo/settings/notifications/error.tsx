"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function TpoMyNotificationsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load My Notifications"
      description="Your college-scoped notification records or preferences could not be retrieved. This failure is not interpreted as an empty inbox or disabled notification preferences."
      action={<Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>}
    />
  );
}
