"use client";
import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerProjectDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState title={"We couldn't load this project's activity"} description={"Please check your connection, then try again. Your project activity has not been changed."}
      action={<div className="flex flex-wrap items-center gap-3"><Button onClick={reset}>Retry</Button><Link href="/learn/projects" className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body">Back to Projects</Link></div>} />
  );
}
