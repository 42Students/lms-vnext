"use client";

import { Button } from "@/components/ui/button";

export default function SuperAdminSettingsError({
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
        Unable to load platform settings
      </h1>
      <p className="mt-2 text-sm leading-6 text-body">
        The settings inventory could not be retrieved.
        Missing data is not treated as a source default.
        Review your selected college scope or retry.
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
