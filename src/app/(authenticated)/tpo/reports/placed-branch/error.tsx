"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";

export default function ErrorPage({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section className="w-full">
    <PageHeader title={"Couldn't load placed students"} />
    <p role="alert" className="mt-2 max-w-2xl break-words text-sm leading-6 text-[var(--lms-body-text)]">
      The report failed to load; that is not evidence of zero placed learners.
    </p>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button type="button" className="min-h-11 w-full sm:w-auto sm:min-h-9" onClick={reset}>Retry</Button><TextLink href="/tpo/reports" className="inline-flex min-h-11 items-center md:min-h-9">All reports</TextLink>
    </div>
  </section>;
}
