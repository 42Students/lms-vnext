"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function CollegePlacementCalendarError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="min-w-0 space-y-[var(--lms-space-4)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]"
    >
      <PageHeader title={"Couldn't load placement interviews"} />
      <p className="max-w-2xl break-words text-sm leading-6 text-body">
        College placement rounds could not be retrieved.
        A failed read does not mean there are no interviews.
      </p>
      <Button
        className="min-h-11 w-full sm:w-auto md:min-h-9"
        onClick={reset}
      >
        Retry
      </Button>
    </section>
  );
}
