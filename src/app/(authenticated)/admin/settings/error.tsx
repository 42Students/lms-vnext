"use client";

import { PageHeader } from "@/components/ui/page-header";
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
      className="min-w-0 space-y-4"
    >
      <PageHeader title={"Unable to load platform settings"} />
      <p className="mt-2 text-sm leading-6 text-body">
        The settings inventory could not be retrieved.
        Missing data is not treated as a source default.
        Review your selected college scope or retry.
      </p>
      <Button
        className="mt-4 min-h-11 w-full sm:min-h-9 sm:w-auto"
        onClick={reset}
      >
        Retry
      </Button>
    </section>
  );
}
