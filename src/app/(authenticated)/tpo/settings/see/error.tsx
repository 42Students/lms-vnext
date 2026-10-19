"use client";

import { Button } from "@/components/ui/button";

export default function TpoWhatCompaniesSeeError({
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
        Couldn&apos;t load company visibility settings
      </h1>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        The college&apos;s recruiter-sharing policy
        could not be retrieved. No default or
        permission state has been inferred from
        this failure.
      </p>

      <Button
        className="mt-5"
        onClick={reset}
      >
        Retry
      </Button>
    </section>
  );
}
