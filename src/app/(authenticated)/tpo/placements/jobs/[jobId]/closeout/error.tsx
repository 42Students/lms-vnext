import {Button} from "@/components/ui/button";
"use client";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="rounded-xl border border-border p-6">
    The close-out counts could not be loaded, so none are inferred.
    <Button variant="secondary" type="button" onClick={reset} className="ml-3">Retry</Button>
  </section>;
}
