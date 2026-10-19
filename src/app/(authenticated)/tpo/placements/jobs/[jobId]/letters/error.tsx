import {Button} from "@/components/ui/button";
"use client";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="rounded-xl border border-border p-6">
    Offer evidence cannot be loaded. It is not assumed to be empty.
    <Button variant="secondary" type="button" className="ml-3" onClick={reset}>Retry</Button>
  </section>;
}
