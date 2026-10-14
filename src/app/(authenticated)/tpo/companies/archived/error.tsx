"use client";
import { Button } from "@/components/ui/button";
export default function ErrorView({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <section role="alert" className="rounded-xl border border-border bg-surface p-6">
    <h1 className="font-semibold text-foreground">Couldn&apos;t load archived relationships</h1>
    <p className="mt-2 text-sm text-body">The database could not be read. No empty list is inferred.</p>
    <Button className="mt-4" onClick={reset}>Retry</Button>
  </section>;
}