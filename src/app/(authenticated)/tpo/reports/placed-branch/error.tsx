"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section role="alert" className="w-full">
    <PageHeader title={"Couldn't load placed students"} />
    <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-[var(--lms-body-text)]">
      The report failed to load; that is not evidence of zero placed learners.
    </p>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
    </div>
  </section>;
}
