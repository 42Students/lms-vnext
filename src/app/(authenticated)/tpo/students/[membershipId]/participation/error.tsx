"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function TpoParticipationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="space-y-3 py-6">
      <PageHeader title={"Could not load participation decision"} />
      <p className="mt-2 text-sm text-body">
        The learner may be outside your college, inactive or missing an unambiguous
        current enrollment. No decision was changed.
      </p>
      <Button className="mt-5" onClick={reset}>Retry</Button>
    </section>
  );
}
