"use client";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section role="alert" className="border-b border-border bg-transparent py-6">
      <h1 className="font-semibold">Couldn&apos;t load cancellation consequences</h1>
      <p className="mt-2 text-sm text-body">No cancellation was applied by this failed read.</p>
      <Button className="mt-4" onClick={reset}>Retry</Button>
    </section>
  );
}
