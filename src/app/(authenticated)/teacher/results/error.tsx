"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";

export default function Error({reset}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  return <section role="alert" className="space-y-3 py-6">
    <PageHeader title={"Unable to load assessment results"} />
    <p className="mt-2 text-sm text-body">
      The read failed; a missing display is not evidence that there are no records.
    </p>
    <Button variant="secondary" type="button" onClick={reset}
      className="mt-4">
      Retry
    </Button>
  </Alert>;
}
