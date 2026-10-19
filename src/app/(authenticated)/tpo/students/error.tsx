"use client";
import { Alert } from "@/components/ui/alert";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function TpoStudentsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="space-y-3 py-6"
    >
      <PageHeader title={"Could not load students"} />
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        College-wide learner and placement data could not be
        retrieved. This failure is not interpreted as zero
        registrations, applications or placements.
      </p>
      <Button className="mt-5" onClick={reset}>
        Retry
      </Button>
    </Alert>
  );
}
