"use client";
import { Button } from "@/components/ui/button";
export default function ErrorView({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <section role="alert" className="rounded-xl border border-border bg-surface p-6">
    <h1 className="font-semibold">Couldn&apos;t load upcoming round export</h1>
    <p className="mt-2 text-sm text-body">No empty calendar or export is inferred after a failed read.</p>
    <Button onClick={reset} className="mt-3">Retry</Button>
  </section>;
}