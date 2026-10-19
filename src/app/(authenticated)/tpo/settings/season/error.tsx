"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="rounded-xl border border-border bg-surface p-6">
      <h1 className="m-0 text-[26px] font-semibold leading-[1.35] tracking-[-0.02em] text-[#172033] sm:text-[30px]">
        Couldn&apos;t load Settings · Season
      </h1>
      <p className="mt-2 text-sm text-body">
        The requested records could not be retrieved. A load failure does not
        mean there are no records or that a reported total is zero.
      </p>
      <Button className="mt-4" onClick={reset}>Retry</Button>
    </section>
  );
}
