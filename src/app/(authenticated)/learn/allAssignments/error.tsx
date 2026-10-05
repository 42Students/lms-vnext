"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerAssessmentsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 text-center">
      <h1 className="m-0 text-xl font-semibold text-foreground">Could not load this page</h1>
      <p className="mt-2 text-sm text-body">
        The assessment list failed to load. This is not treated as an empty list.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/learn/courses" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">
          Back to Courses
        </Link>
      </div>
    </div>
  );
}
