"use client";
import { ErrorState } from "@/components/ui/error-state";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerInterviewError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState title={"Interviews could not load"} description={"A loading failure does not mean you have no scheduled interview rounds."}
      action={<div className="flex flex-wrap items-center gap-3"><Button onClick={reset}>Retry</Button><Link href="/learn/my-placements/interviews"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline sm:min-h-9">
          All interviews
        </Link></div>} />
  );
}
