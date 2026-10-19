"use client";

import { Button } from "@/components/ui/button";

export default function LearnerCalendarError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="px-3 py-10 text-center">
      <h1 className="font-semibold text-[var(--lms-heading)] text-[30px] leading-9">
        Unable to load class schedule. Please try again.
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Calendar events may be incomplete. Please try refreshing the page.
      </p>
      <div className="mt-5 flex justify-center">
        <Button onClick={reset}>
          Retry
        </Button>
      </div>
    </section>
  );
}
