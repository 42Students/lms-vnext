"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section role="alert" className="w-full">
    <PageHeader title={"Couldn't load Reports · Unplaced"} />
    <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-[var(--lms-body-text)]">
      The requested records could not be retrieved. A load failure does not mean there are no records or that a reported total is zero.
    </p>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
    </div>
  </section>;
}
