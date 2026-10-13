"use client";

import { Button } from "@/components/ui/button";

export default function CollegePlacementCalendarError({
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
        Couldn&apos;t load placement interviews
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        College placement rounds could not be retrieved.
        A failed read does not mean there are no interviews.
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
