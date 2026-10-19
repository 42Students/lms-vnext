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
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button className="max-md:min-h-11" onClick={reset}>Retry</Button>
      </div>
    </section>
  );
}
