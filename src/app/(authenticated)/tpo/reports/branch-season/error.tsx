"use client";
import { Button } from "@/components/ui/button";
export default function TpoBranchSeasonError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="rounded-xl border border-border bg-surface p-6">
      <h1 className="text-lg font-semibold">Couldn&apos;t load branch evidence</h1>
      <p className="mt-2 text-sm text-body">
        Persisted season, offer or application evidence could not be read.
        Missing data is not interpreted as a zero placement rate.
      </p>
      <Button className="mt-4" onClick={reset}>Retry</Button>
    </section>
  );
}
