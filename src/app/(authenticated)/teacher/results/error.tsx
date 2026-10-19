import {Button} from "@/components/ui/button";
"use client";

export default function Error({reset}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  return <section role="alert" className="border-b border-border bg-transparent py-6">
    <h1 className="font-semibold text-[30px] text-[var(--lms-heading)]">Unable to load assessment results</h1>
    <p className="mt-2 text-sm text-body">
      The read failed; a missing display is not evidence that there are no records.
    </p>
    <Button variant="secondary" type="button" onClick={reset}
      className="mt-4">
      Retry
    </Button>
  </section>;
}
