"use client";

import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function ErrorView({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Messages" />
    <ErrorState title="Could not load conversations"
      description="Your employer messages could not be loaded. This does not mean they were deleted or marked read."
      action={<Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>} />
  </div>;
}
