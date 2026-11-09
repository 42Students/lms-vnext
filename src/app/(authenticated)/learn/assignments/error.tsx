"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";

/** A failed legacy bookmark is not an empty assignment list. Preserve
 * sanitized error reporting and retry without replacing the learner shell. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Assignments could not be loaded" />
    <p className="text-sm text-body">
      The assignment page could not be opened. This does not mean you have no assignments.
    </p>
    <GracefulErrorBoundary error={error} reset={reset} insideShell
      showHeader={false} homeHref="/learn" />
    <ButtonLink variant="secondary" href="/learn/allAssignments"
      className="min-h-11 w-full sm:w-auto md:min-h-9">
      View all assignments
    </ButtonLink>
  </section>;
}
