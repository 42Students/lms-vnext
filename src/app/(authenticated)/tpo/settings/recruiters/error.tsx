"use client";

import {
  Button,
} from "@/components/ui/button";

export default function TpoRecruiterAccessError({
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="rounded-xl border border-border bg-surface px-6 py-10 text-center"
    >
      <h1 className="text-lg font-semibold text-foreground">
        Couldn&apos;t load recruiter access
      </h1>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        The college&apos;s recruiter grants
        could not be retrieved. No active
        access or revoked-access conclusion
        has been inferred from this failure.
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
