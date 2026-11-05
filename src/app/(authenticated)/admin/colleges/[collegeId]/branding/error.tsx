"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";

export default function CollegeBrandingPreviewError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
   <div className="min-w-0 space-y-4">
    <PageHeader title="Look and feel"/>
    <section aria-label="Branding load error" className="min-w-0 rounded-[var(--lms-radius-card)] border border-border bg-surface p-4">
    <ErrorState
      title="Could not load college branding"
      description="Branding settings could not be retrieved. No default or missing-data conclusion is inferred."
      action={
        <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
          <ButtonLink variant="secondary"
            href="/admin/colleges"
            className="w-full sm:w-auto"
          >
            Colleges
          </ButtonLink>
        </div>
      }
    />
    </section>
   </div>
  );
}
