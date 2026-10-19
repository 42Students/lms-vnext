"use client";
import { PageHeader } from "@/components/ui/page-header";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerInterviewError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="py-6 text-center">
      <PageHeader title={"Interviews could not load"} />
      <p className="mt-2 text-sm text-body">
        A loading failure does not mean you have no scheduled interview rounds.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <Link href="/learn/my-placements/interviews"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline sm:min-h-9">
          All interviews
        </Link>
      </div>
    </section>
  );
}
