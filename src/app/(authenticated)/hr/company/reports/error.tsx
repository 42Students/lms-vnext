"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";

export default function RecruiterCompanyReportsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="space-y-4"
    >
      <PageHeader title={"Couldn't load Company Reports"} />
      <p className="mt-2 max-w-xl text-sm leading-6 text-body">
        Hiring report records could not be retrieved for
        your selected college. This error does not establish
        that there are zero applications, drives or offers.
      </p>
      <Button className="mt-5" onClick={reset}>
        Retry
      </Button>
    </section>
  );
}
