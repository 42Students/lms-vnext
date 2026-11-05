"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";

export default function LearnerNotificationsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Unable to load notifications" />
    <Alert tone="error">
      <p>Your notifications could not be loaded. Try again, or return to your dashboard.</p>
      <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" variant="secondary" onClick={reset}>Retry</Button>
        <ButtonLink variant="secondary" href="/learn" className="w-full">Learner Home</ButtonLink>
      </div>
    </Alert>
  </section>;
}
