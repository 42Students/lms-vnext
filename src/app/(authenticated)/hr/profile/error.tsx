"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";

export default function RecruiterProfileError({
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
      <PageHeader title={"Couldn't load your recruiter profile"} />
      <p className="mt-2 max-w-xl text-sm leading-6 text-body">
        Your account or college access details could not
        be retrieved. No access status or grant date is
        inferred from a failed database read.
      </p>
      <Button className="mt-5" onClick={reset}>
        Retry
      </Button>
    </section>
  );
}
