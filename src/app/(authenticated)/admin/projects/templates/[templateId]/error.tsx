"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";

export default function SuperAdminTemplateDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <ProjectAdminNav
        basePath="/admin/projects"
        active="templates"
      />

      <PageHeader
        title="Project template"
        description="The requested template section is unavailable."
      />

      <ErrorState
        title="Could not load template details"
        description="The template may no longer be available, or the current administrative scope may not permit this global read. Retry or return to the template catalogue."
        action={
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              variant="secondary"
              onClick={reset}
            >
              Retry
            </Button>

            <Link
              href="/admin/projects/templates"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-[650] text-body hover:bg-muted md:min-h-9 hover:border-[var(--lms-primary)] hover:text-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
            >
              Template catalogue
            </Link>
          </div>
        }
      />
    </div>
  );
}
