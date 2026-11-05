"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Archived company relationships" />
    <ErrorState title="Couldn't load archived relationships"
      description="The database could not be read. No empty list is inferred."
      action={<>
        <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
        <TextLink href="/tpo/companies?directory=1" className="inline-flex min-h-11 items-center px-3 md:min-h-9">← Companies directory</TextLink>
      </>}
    />
  </div>;
}
