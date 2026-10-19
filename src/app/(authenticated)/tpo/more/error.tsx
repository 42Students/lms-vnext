"use client";

import { Button } from "@/components/ui/button";

export default function TpoMoreError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface px-6 py-10 text-center"
    >
      <h1 className="text-lg font-semibold text-foreground">
        Unable to load More
      </h1>
      <p className="mt-2 text-sm leading-6 text-body">
        The TPO navigation page could not be loaded.
        Existing sidebar destinations remain available.
      </p>
      <Button
        className="mt-5"
        onClick={reset}
      >
        Retry
      </Button>
    </section>
  );
}
