"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section role="alert" className="w-full">
    <PageHeader title={"Couldn't load the season pipeline"} />
    <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-[var(--lms-body-text)]">
      The persisted records could not be retrieved. A load failure does not mean zero placements.
    </p>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
    </div>
  </section>;
}
