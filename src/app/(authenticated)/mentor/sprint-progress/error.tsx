"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section role="alert" className="border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
    <PageHeader title={"Unable to load Mentor sprint progress"} />
    <p className="mt-2 text-sm text-body">
      The read failed. No data absence is inferred from this error.
    </p>
    <Button type="button" variant="secondary" className="mt-4 w-full md:w-auto" onClick={reset}>
      Retry
    </Button>
  </section>;
}
