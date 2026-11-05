"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Companies" />
    <ErrorState title="Couldn't load companies"
      description="The company directory could not be retrieved. No company, lead, drive or offer count is inferred from this failure."
      action={<>
        <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
        <TextLink href="/tpo/recruiters?view=companies" className="inline-flex min-h-11 items-center px-3 md:min-h-9">Back to companies</TextLink>
      </>}
    />
  </div>;
}
