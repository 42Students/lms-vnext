"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";

/** A failed legacy bookmark is not an empty assignment list. Keep recovery
 * inside the learner shell and give a safe exit to the canonical list. */
export default function RouteError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Assignments could not be loaded" />
    <Alert tone="error">
      The assignment page could not be opened. This does not mean you have no assignments.
    </Alert>
    <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <Button type="button" onClick={reset}
        className="min-h-11 w-full sm:w-auto md:min-h-9">Retry</Button>
      <ButtonLink variant="secondary" href="/learn/allAssignments"
        className="min-h-11 w-full sm:w-auto md:min-h-9">
        View all assignments
      </ButtonLink>
    </div>
  </section>;
}
