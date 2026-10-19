"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";

export default function HrCalendarError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section className="space-y-4">
    <PageHeader title="Couldn't load your recruiter calendar" />
    <Alert tone="error">
      <p>Your authorized hiring events could not be retrieved. This is a loading error, not evidence that your calendar is empty.</p>
      <div><Button type="button" variant="secondary" onClick={reset}>Retry</Button></div>
    </Alert>
  </section>;
}
