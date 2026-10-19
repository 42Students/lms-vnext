"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="border-b border-border bg-transparent py-6">
    <h1 className="font-semibold">Couldn&apos;t load drive lifecycle</h1>
    <p className="mt-2 text-sm text-body">A failed read is not evidence that there are no drives.</p>
    <Button className="mt-4" onClick={reset}>Retry</Button>
  </section>;
}
