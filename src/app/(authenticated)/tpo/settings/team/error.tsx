"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";

export default function TpoPlacementTeamError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="border-t border-border pt-5 text-center"
    >
      <PageHeader title={"Couldn't load Placement Team"} />
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        College membership and coordinator records could not
        be retrieved. This failure is not interpreted as an
        empty team or zero coordinator assignments.
      </p>
      <Button className="mt-5" onClick={reset}>
        Retry
      </Button>
    </section>
  );
}
