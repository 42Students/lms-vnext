"use client";

import { Button } from "@/components/ui/button";

export default function LearnerProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
      <h1 className="text-lg font-semibold text-foreground">
        Unable to load your profile
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Your core profile could not be loaded. Optional placement sections fail independently and never blank this page.
      </p>
      <div className="mt-5 flex justify-center">
        <Button onClick={reset}>Retry</Button>
      </div>
    </section>
  );
}
