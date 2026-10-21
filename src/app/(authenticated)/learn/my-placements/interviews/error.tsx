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
      <PageHeader title="We could not load your schedule" />
      <p className="mt-2 text-sm text-body">
        A loading failure does not mean you have no scheduled interview rounds.
      </p>
      <div className="mt-4 flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
        <Link href="/learn/my-placements/interviews"
          className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto text-sm font-semibold text-primary-text hover:underline md:min-h-9">
          All interviews
        </Link>
      </div>
    </section>
  );
}
