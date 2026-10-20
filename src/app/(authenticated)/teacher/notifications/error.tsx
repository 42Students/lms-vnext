"use client";

import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Button } from "@/components/ui/button";

export default function FacultyNotificationsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="min-w-0 space-y-4">
      <PageHeader title={"Unable to load Notifications"} />
      <p className="mt-2 text-sm text-body">
        This Faculty page could not load. Retry to recheck current access.
      </p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={reset} className="w-full sm:w-auto">Retry</Button>
        <PageBackLink href="/teacher/courses" label="Back to Courses" />
      </div>
    </section>
  );
}
