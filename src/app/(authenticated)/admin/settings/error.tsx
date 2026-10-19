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
      className="border-t border-border pt-5 text-center"
    >
      <h1 className="m-0 text-[26px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)] sm:text-[30px]">
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
