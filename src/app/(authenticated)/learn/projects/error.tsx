"use client";
import { ErrorState } from "@/components/ui/error-state";

import { Button } from "@/components/ui/button";
export default function LearnerProjectsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState title={"Projects could not be loaded"} description={"Check your connection, then try again. Your project data has not been changed."}
      action={<div className="flex flex-wrap items-center gap-3"><Button onClick={reset}>Retry</Button></div>} />
  );
}
