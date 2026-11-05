"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Actor and entity audit" />
    <ErrorState
      title="Couldn't load actor audit"
      description="Recorded activity could not be retrieved; no zero count is inferred."
      action={<>
        <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
        <TextLink href="/tpo/audit"
          className="inline-flex min-h-11 items-center text-sm md:min-h-9">
          ← All audit sources
        </TextLink>
      </>}
    />
  </div>;
}
