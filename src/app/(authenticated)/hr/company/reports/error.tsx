"use client";

import { Button } from "@/components/ui/button";

export default function RecruiterCompanyReportsError({
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
        Couldn&apos;t load Company Reports
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Hiring report records could not be retrieved for
        your selected college. This error does not establish
        that there are zero applications, drives or offers.
      </p>
      <Button className="mt-5" onClick={reset}>
        Retry
      </Button>
    </section>
  );
}
