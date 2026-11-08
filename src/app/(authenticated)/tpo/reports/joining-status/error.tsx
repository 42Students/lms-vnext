"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";

export default function ErrorPage({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section className="space-y-3">
    <PageHeader title={"Couldn't load Reports · Joining Status"} />
    <p role="alert" className="mt-2 max-w-2xl break-words text-sm leading-6 text-[var(--lms-body-text)]">
      The requested records could not be retrieved. A load failure does not mean there are no records or that a reported total is zero.
    </p>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button type="button" className="min-h-11 w-full sm:w-auto sm:min-h-9" onClick={reset}>Retry</Button><TextLink href="/tpo/reports" className="inline-flex min-h-11 items-center md:min-h-9">All reports</TextLink>
    </div>
  </section>;
}
