import {Button} from "@/components/ui/button";
"use client";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="rounded-xl border border-border p-6">
    Candidate round schedules could not be loaded; this is not an empty schedule.
    <Button variant="secondary" type="button" onClick={reset} className="ml-3">Retry</Button>
  </section>;
}
