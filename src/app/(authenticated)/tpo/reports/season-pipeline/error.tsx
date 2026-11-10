"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";

export default function ErrorPage({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section className="min-w-0 w-full space-y-3">
    <PageHeader title={"Couldn't load the season pipeline"} />
    <p role="alert" className="mt-2 max-w-2xl break-words text-sm leading-6 text-[var(--lms-body-text)]">
      The persisted records could not be retrieved. A load failure does not mean zero placements.
    </p>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button><TextLink href="/tpo/reports" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9">All reports</TextLink>
    </div>
  </section>;
}
