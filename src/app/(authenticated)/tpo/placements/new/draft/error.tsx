"use client";

import { Button } from "@/components/ui/button";

export default function ErrorView({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="border-b border-border bg-transparent py-6">
      <h1 className="text-lg font-semibold text-foreground">Couldn&apos;t load draft drive setup</h1>
      <p className="mt-2 text-sm text-body">
        Employer and season options could not be loaded. No empty selection is assumed.
      </p>
      <Button className="mt-4" onClick={reset}>Retry</Button>
    </section>
  );
}
