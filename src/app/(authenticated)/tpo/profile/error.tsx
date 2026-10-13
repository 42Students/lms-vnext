"use client";

import { Button } from "@/components/ui/button";

export default function TpoProfileError({
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
        Unable to load your profile
      </h1>
      <p className="mt-2 text-sm leading-6 text-body">
        Your own TPO membership information could not be
        retrieved. No account details are inferred from
        this failure.
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
