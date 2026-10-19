"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerPlacementsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="py-8 text-center">
      <h1 className="m-0 font-semibold text-[var(--lms-heading)] text-[30px] leading-9">
        We could not load your placements
      </h1>
      <p className="mt-2 text-sm text-body">
        Your data is safe. Check your connection and try again. This is a loading problem, not an empty account.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <Link href="/learn" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">
          Learner Home
        </Link>
      </div>
    </section>
  );
}
