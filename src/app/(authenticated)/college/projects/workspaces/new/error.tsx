"use client";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";

export default function ClassWorkspaceError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 space-y-4" role="alert">
    <PageHeader title="Could not open workspace creator"
      description="The class or project template information could not be loaded."
      actions={<ButtonLink variant="secondary" href="/college/projects">
        Back to workspaces
      </ButtonLink>} />
    <p className="text-sm text-muted-foreground">
      Nothing has been created. Retry this page, or return to your project workspaces.
    </p>
    <Button type="button" onClick={reset} className="min-h-11 md:min-h-9">
      Retry opening creator
    </Button>
  </div>;
}
