"use client";

import { Button } from "@/components/ui/button";

export default function TpoParticipationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="rounded-xl border border-border bg-surface p-8 text-center">
      <h1 className="text-lg font-semibold text-foreground">Could not load participation decision</h1>
      <p className="mt-2 text-sm text-body">
        The learner may be outside your college, inactive or missing an unambiguous
        current enrollment. No decision was changed.
      </p>
      <Button className="mt-5" onClick={reset}>Retry</Button>
    </section>
  );
}
