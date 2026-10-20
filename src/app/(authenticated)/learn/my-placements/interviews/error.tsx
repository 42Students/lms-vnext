"use client";
import { PageHeader } from "@/components/ui/page-header";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerInterviewError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title={"Interviews could not load"} />
      <p className="mt-2 text-sm text-body">
        A loading failure does not mean you have no scheduled interview rounds.
      </p>
      <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3">
        <Button className="max-md:min-h-11" onClick={reset}>Retry</Button>
        <Link href="/learn/my-placements/interviews"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline md:min-h-9">
          All interviews
        </Link>
      </div>
    </section>
  );
}
