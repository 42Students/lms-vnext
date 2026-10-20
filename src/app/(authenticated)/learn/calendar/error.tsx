"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function LearnerCalendarError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title="Class Schedule" />
      <Alert tone="error" className="max-w-2xl"><p className="font-semibold">Unable to load class schedule. Please try again.</p><p>Calendar events may be incomplete. Please try refreshing the page.</p></Alert>
      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>
          Retry
        </Button>
      </div>
    </section>
  );
}
