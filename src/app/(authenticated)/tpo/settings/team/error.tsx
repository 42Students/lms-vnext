"use client";

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
      <h1 className="m-0 text-[26px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)] sm:text-[30px]">
        Couldn&apos;t load Placement Team
      </h1>
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
