"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";
export default function LearnerProjectsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="min-w-0 space-y-4">
      <PageHeader title={"Projects could not be loaded"} />
      <p className="mt-2 max-w-2xl text-sm leading-6 text-body">
        Check your connection, then try again. Your project data has not been changed.
      </p>
      <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
      </div>
    </section>
  );
}
