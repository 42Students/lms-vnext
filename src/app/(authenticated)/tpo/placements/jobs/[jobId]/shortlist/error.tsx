"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="rounded-xl border border-border bg-surface p-6">
      <h1 className="text-lg font-semibold text-foreground">
        Couldn&apos;t load drive shortlist
      </h1>
      <p className="mt-2 text-sm text-body">
        Data could not be retrieved; no zero count or conflict-free conclusion
        can be inferred from this failure.
      </p>
      <Button className="mt-4" onClick={reset}>Retry</Button>
    </section>
  );
}
