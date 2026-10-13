"use client";

import {
  Button,
} from "@/components/ui/button";

export default function HrCalendarError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="rounded-xl border border-border bg-surface px-6 py-10 text-center"
    >
      <h1 className="text-lg font-semibold text-foreground">
        Couldn&apos;t load your recruiter calendar
      </h1>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Your authorized hiring events could not be
        retrieved. This is a loading error, not
        evidence that your calendar is empty.
      </p>

      <Button
        className="mt-5"
        onClick={reset}
      >
        Retry
      </Button>
    </section>
  );
}
