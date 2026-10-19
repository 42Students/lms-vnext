"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section role="alert" className="border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
    <PageHeader title={"Unable to load Mentor team history"} />
    <p className="mt-2 text-sm text-body">
      This request failed. The absence of results is not assumed.
    </p>
    <Button type="button" variant="secondary" onClick={reset}>
      Retry
    </Button>
  </section>;
}
