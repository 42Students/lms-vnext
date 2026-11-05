"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { ButtonLink } from "@/components/ui/button-link";

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

            <ButtonLink variant="secondary"
              href="/admin/projects/templates"
            >
              Template catalogue
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}
