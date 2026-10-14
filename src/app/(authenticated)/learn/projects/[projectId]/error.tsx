"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerProjectDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="rounded-xl border border-border bg-surface px-5 py-10 text-center">
      <h1 className="text-lg font-semibold text-foreground">Couldn&apos;t load Project details</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm text-body">
        Your Project workspace could not be loaded. Retry instead of treating this failure as an empty Board.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <Link href="/learn/projects" className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-body">Back to Projects</Link>
      </div>
    </section>
  );
}
