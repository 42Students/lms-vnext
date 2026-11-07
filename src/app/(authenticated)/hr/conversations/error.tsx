"use client";

import { TextLink } from "@/components/ui/text-link";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function ErrorView({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Messages" />
    <ErrorState title="Could not load conversations"
      description="Your employer messages could not be loaded. This does not mean they were deleted or marked read."
      action={<span className="inline-flex min-w-0 flex-wrap items-center gap-3"><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><TextLink href="/hr/home" className="inline-flex min-h-11 items-center justify-center px-3 text-sm md:min-h-9">Back to recruiter home</TextLink></span>} />
  </div>;
}
