"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";

export default function TpoMyNotificationsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="space-y-3 py-6"
    >
      <PageHeader title={"Couldn't load My Notifications"} />

      <ErrorState title="Couldn't load My Notifications"
        description="Your college-scoped notification records or preferences could not be retrieved. This failure is not interpreted as an empty inbox or disabled notification preferences."
        action={<Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>}/>
    </section>
  );
}
