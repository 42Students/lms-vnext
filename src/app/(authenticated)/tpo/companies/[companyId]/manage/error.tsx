"use client";
import { Button } from "@/components/ui/button";
export default function ErrorView({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section role="alert" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-6">
    <h1 className="font-semibold text-foreground">Couldn&apos;t load company relationship</h1>
    <p className="mt-2 text-sm text-body">No saved state can be inferred from this error.</p>
    <Button className="mt-4" onClick={reset}>Retry</Button>
  </section>;
}
