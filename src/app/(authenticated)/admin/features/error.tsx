"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Banner } from "@/components/ui/banner";

export default function SuperAdminFeaturesError({
  reset,
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const detail = process.env.NODE_ENV === "development" && error.message?.trim()
    ? error.message.trim()
    : "Please retry loading the stored module rules.";
  return (
    <section className="min-w-0 space-y-[var(--lms-space-3)]">
      <Banner tone="warning">Could not load feature controls. The module switches remain unavailable until the rules can be read.</Banner>
      <ErrorState
      title="Could not load Feature Controls"
      description={`The persisted module rules could not be retrieved. ${detail}`}
      action={
        <Button
          variant="secondary"
          onClick={reset}
         className="w-full md:w-auto">
          Retry
        </Button>
      }
    /></section>
  );
}
