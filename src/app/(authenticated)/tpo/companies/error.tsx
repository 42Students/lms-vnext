"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Companies" />
    <ErrorState title="Couldn't load companies"
      description="The company directory could not be retrieved. No company, lead, drive or offer count is inferred from this failure."
      action={<>
        <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
        <Link href="/tpo/recruiters?view=companies" className="lms-inline-link inline-flex min-h-11 items-center px-3 font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Back to companies</Link>
      </>}
    />
  </div>;
}
