"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="rounded-xl border border-border bg-surface p-6">
    <h1 className="text-lg font-semibold text-foreground">Couldn&apos;t load expiry watchlist</h1>
    <p className="mt-2 text-sm text-body">
      Expiry records could not be loaded. This is not evidence that no offers are expiring.
    </p>
    <Button className="mt-4" onClick={reset}>Retry</Button>
  </section>;
}
