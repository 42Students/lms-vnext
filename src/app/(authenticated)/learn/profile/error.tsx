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
    <section role="alert" className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
      <h1 className="text-lg font-semibold text-foreground">
        Unable to load your profile
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Your saved profile could not be retrieved. No empty profile or successful save has been assumed. Retry to reload your profile.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button className="min-h-11" onClick={reset}>Retry</Button>
        <Link href="/learn/courses" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Courses</Link>
      </div>
    </section>
  );
}
