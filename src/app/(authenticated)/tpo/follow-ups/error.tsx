"use client";
import { Button } from "@/components/ui/button";
export default function ErrorView({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="border-b border-border bg-transparent py-6">
      <h1 className="text-lg font-semibold text-foreground">
        Couldn&apos;t load recruiter follow-ups
      </h1>
      <p className="mt-2 text-sm text-body">
        Follow-up data could not be retrieved. Missing data is not treated as zero.
      </p>
      <Button className="mt-4" onClick={reset}>Retry</Button>
    </section>
  );
}
