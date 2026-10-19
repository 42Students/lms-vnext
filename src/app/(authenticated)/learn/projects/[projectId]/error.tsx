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
    <section role="alert" className="px-3 py-10 text-center">
      <PageHeader title={"We couldn't load this project's activity"} />
      <p className="mx-auto mt-2 max-w-lg text-sm text-body">
        Please check your connection, then try again. Your project activity has not been changed.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <Link href="/learn/projects" className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body">Back to Projects</Link>
      </div>
    </section>
  );
}
