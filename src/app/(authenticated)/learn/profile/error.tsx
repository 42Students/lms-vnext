"use client";
import { ErrorState } from "@/components/ui/error-state";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState title={"Unable to load your profile"} description={"Your saved profile could not be retrieved. No empty profile or successful save has been assumed. Retry to reload your profile."}
      action={<div className="flex flex-wrap items-center gap-3"><Button className="min-h-11" onClick={reset}>Retry</Button><Link href="/learn/courses" className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">Courses</Link></div>} />
  );
}
