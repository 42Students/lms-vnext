"use client";

import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function ErrorView({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <>
    <PageHeader title="Messages" />
    <ErrorState title="Could not load conversations"
      description="Your employer messages could not be loaded. This does not mean they were deleted or marked read."
      action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>} />
  </>;
}
