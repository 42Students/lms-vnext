"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

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
          <Link
            href="/admin/colleges"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius,9px)] sm:w-auto border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-body hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
          >
            Colleges
          </Link>
        </div>
      }
    />
    </section>
   </div>
  );
}
