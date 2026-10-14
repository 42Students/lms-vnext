"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerInterviewError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 text-center">
      <h1 className="text-lg font-semibold text-foreground">Interviews could not load</h1>
      <p className="mt-2 text-sm text-body">
        A loading failure does not mean you have no scheduled interview rounds.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <Link href="/learn/my-placements/interviews"
          className="inline-flex min-h-10 items-center font-semibold text-primary-text">
          All interviews
        </Link>
      </div>
    </section>
  );
}
