"use client";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerProjectDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="min-w-0 space-y-4">
      <PageHeader title={"We couldn't load this project's activity"} />
      <p className="mt-2 max-w-2xl text-sm leading-6 text-body">
        Please check your connection, then try again. Your project activity has not been changed.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button className="max-md:min-h-11" onClick={reset}>Retry</Button>
        <Link href="/learn/projects" className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body">Back to Projects</Link>
      </div>
    </section>
  );
}
