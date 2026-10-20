"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function Error({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <section role="alert" className="min-w-0 max-w-full space-y-3 border-b border-border pb-4">
    <PageHeader title={"Unable to load delivery reviews"} />
    <p className="m-0 text-sm text-body">This failure is not evidence that your assigned projects have no records.</p>
    <Button type="button" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto" onClick={reset}>Retry</Button>
  </section>;
}
