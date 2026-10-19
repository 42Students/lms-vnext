"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="px-3 py-10 text-center">
      <h1 className="font-semibold text-[var(--lms-heading)] text-[30px] leading-9">
        Unable to load your profile
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Your saved profile could not be retrieved. No empty profile or successful save has been assumed. Retry to reload your profile.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button className="min-h-11" onClick={reset}>Retry</Button>
        <Link href="/learn/courses" className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">Courses</Link>
      </div>
    </section>
  );
}
