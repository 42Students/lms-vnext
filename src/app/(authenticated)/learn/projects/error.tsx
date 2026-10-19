"use client";

import { Button } from "@/components/ui/button";
export default function LearnerProjectsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="px-3 py-10 text-center sm:px-6">
      <h1 className="font-semibold text-[var(--lms-heading)] text-[30px] leading-9">Projects could not be loaded</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Check your connection, then try again. Your project data has not been changed.
      </p>
      <div className="mt-5 flex justify-center">
        <Button onClick={reset}>Retry</Button>
      </div>
    </section>
  );
}
