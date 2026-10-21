"use client";

import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Button } from "@/components/ui/button";

export default function FacultyNotificationsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title="Couldn't load notifications" />
      <p role="alert" className="mt-2 text-sm text-body">
        Couldn't load notifications. Please try again.
      </p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={reset} className="w-full sm:w-auto">Retry</Button>
        <PageBackLink href="/teacher/courses" label="Back to Courses" />
      </div>
    </section>
  );
}
