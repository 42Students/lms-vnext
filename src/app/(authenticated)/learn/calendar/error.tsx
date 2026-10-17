"use client";

import { Button } from "@/components/ui/button";

export default function LearnerCalendarError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
      <h1 className="text-lg font-semibold text-foreground">
        Unable to load class schedule
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Calendar events may be incomplete. Please try refreshing the page. Your class schedule could not be fully loaded.
      </p>
      <div className="mt-5 flex justify-center">
        <Button onClick={reset}>
          Retry
        </Button>
      </div>
    </section>
  );
}
