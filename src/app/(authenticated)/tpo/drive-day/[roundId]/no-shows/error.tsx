"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Drive Day no-show report" />
    <ErrorState title="Couldn't load Drive Day no-show report"
      description="The records could not be retrieved. No missing record or zero count is inferred."
      action={<>
        <Button variant="secondary" type="button" onClick={reset}>Retry</Button>
        <TextLink href="/tpo/drive-day" className="inline-flex min-h-11 items-center px-3 text-sm md:min-h-9">Drive Day</TextLink>
      </>}
    />
  </div>;
}
