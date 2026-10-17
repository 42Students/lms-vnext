"use client";

import { Button } from "@/components/ui/button";
export default function LearnerProjectsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="rounded-xl border border-border bg-surface px-5 py-10 text-center sm:px-8">
      <h1 className="text-lg font-semibold text-foreground">Projects could not be loaded</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Check your connection, then try again. Your project data has not been changed.
      </p>
      <div className="mt-5 flex justify-center">
        <Button onClick={reset}>Retry</Button>
      </div>
    </section>
  );
}
