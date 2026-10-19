"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="border-b border-border bg-transparent py-6">
      <h1 className="text-lg font-semibold text-foreground">
        Couldn&apos;t load Placements
      </h1>
      <p className="mt-2 text-sm text-body">
        The requested records could not be retrieved. A load failure does not
        mean there are no records or that a reported total is zero.
      </p>
      <Button className="mt-4" onClick={reset}>Retry</Button>
    </section>
  );
}
