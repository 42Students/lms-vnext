"use client";
import {PageHeader} from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";

export default function Error({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section role="alert" className="min-w-0 space-y-4">
    <PageHeader title={"Unable to load Faculty Section assessment health"} />
    <p className="mt-2 text-sm text-body">
      The read failed. This does not prove that the records are empty.
    </p>
    <Button type="button" onClick={reset}>
      Retry
    </Button>
  </section>;
}
