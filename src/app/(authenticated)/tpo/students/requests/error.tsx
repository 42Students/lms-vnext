"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function TpoStudentRequestsError({
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
      <PageHeader title={"Couldn't load Student Requests"} />
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        The global placement request queue could not be
        retrieved. No request status, count or empty result
        is inferred from this failure.
      </p>
      <Button className="mt-5" onClick={reset}>
        Retry
      </Button>
    </section>
  );
}
