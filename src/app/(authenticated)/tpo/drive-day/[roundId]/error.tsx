"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Drive Day round" />
    <ErrorState title="Couldn't load this Drive Day round"
      description="The round roster and progress could not be retrieved. No empty roster or result count has been inferred from this failure."
      action={<>
        <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
        <TextLink href="/tpo/drive-day" className="inline-flex min-h-11 items-center px-3 text-sm md:min-h-9">Drive Day</TextLink>
      </>}
    />
  </div>;
}
