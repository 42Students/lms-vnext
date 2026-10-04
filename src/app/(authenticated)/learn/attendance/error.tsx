"use client";

import { Button } from "@/components/ui/button";

export default function LearnerAttendanceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
      <h1 className="text-lg font-semibold text-foreground">
        Couldn&apos;t load attendance
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        This is a data-load failure, not a zero-attendance state. Retry to load the actual records.
      </p>
      <div className="mt-5 flex justify-center">
        <Button onClick={reset}>
          Retry
        </Button>
      </div>
    </section>
  );
}
