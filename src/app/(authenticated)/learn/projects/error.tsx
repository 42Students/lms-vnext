"use client";
import { Alert } from "@/components/ui/alert";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function LearnerProjectsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="space-y-3 py-6">
      <PageHeader title={"Projects could not be loaded"} />
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Check your connection, then try again. Your project data has not been changed.
      </p>
      <div className="mt-5 flex justify-center">
        <Button onClick={reset}>Retry</Button>
      </div>
    </Alert>
  );
}
