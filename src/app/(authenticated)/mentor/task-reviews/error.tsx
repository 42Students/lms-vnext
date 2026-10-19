"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section role="alert" className="border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
    <PageHeader title={"Unable to load Mentor task reviews"} />
    <p className="mt-2 text-sm text-body">The read failed. It is not proof that data is absent.</p>
    <Button type="button" variant="secondary" onClick={reset}>
      Retry
    </Button>
  </section>;
}
