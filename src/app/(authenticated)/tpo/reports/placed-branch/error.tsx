"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <Alert tone="error" className="w-full">
    <h1 className="m-0 text-balance break-words text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">
      Couldn&apos;t load placed students
    </h1>
    <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-[var(--lms-body-text)]">
      The report failed to load; that is not evidence of zero placed learners.
    </p>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
    </div>
  </Alert>;
}
