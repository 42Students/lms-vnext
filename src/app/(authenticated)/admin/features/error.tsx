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
      <Banner tone="warning" role="alert">
       Could not load feature controls. The module catalog and the selected scope's stored rules are independent reads.
       A missing catalog must not be treated as an empty module list; existing rules cannot be safely edited until both
       sources are available. Retry without changing college or organization.
      </Banner>
      <div className="flex flex-wrap gap-2">
       <Button type="button" variant="secondary" onClick={reset} className="min-h-11 w-full sm:w-auto md:min-h-9">
        Retry module catalog
       </Button>
       <Button type="button" variant="secondary" onClick={()=>window.location.reload()}
        className="min-h-11 w-full sm:w-auto md:min-h-9">Reload scoped rules</Button>
      </div>
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
