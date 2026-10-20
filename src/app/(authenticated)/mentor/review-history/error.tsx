"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function Error({reset}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  return <section role="alert" className="min-w-0 max-w-full space-y-3 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
    <PageHeader title={"Unable to load delivery review history"} />
    <p className="m-0 text-sm text-body">
      The read failed; a missing display is not evidence that there are no records.
    </p>
    <Button type="button" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto" onClick={reset}>
      Retry
    </Button>
  </section>;
}
