"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section role="alert" className="space-y-3 py-4">
    <PageHeader title={"Unable to load Mentor team coverage"} />
    <p className="mt-2 text-sm text-body">
      The read failed. This does not prove that the records are empty.
    </p>
    <Button type="button" variant="secondary" className="mt-4 w-full md:w-auto" onClick={reset}>
      Retry
    </Button>
  </section>;
}
