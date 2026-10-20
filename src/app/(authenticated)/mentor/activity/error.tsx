"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function Error({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <section role="alert" className="min-w-0 max-w-full space-y-4">
    <PageHeader title={"Unable to load project activity"} />
    <p className="m-0 text-sm text-body">This failure is not evidence that your assigned projects have no records.</p>
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center"><Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button></div>
  </section>;
}
