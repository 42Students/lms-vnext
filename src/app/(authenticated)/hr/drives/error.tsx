"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-w-0 max-w-full space-y-4"><Alert tone="error" title="Drives could not load">
      <p className="mb-3 text-sm leading-6">Your authorized drive list could not be retrieved. This does not mean any drives were deleted or changed.</p>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Try again</Button>
        <TextLink href="/hr/home" className="inline-flex min-h-11 items-center md:min-h-9">Back to recruiter home</TextLink>
      </div>
    </Alert></div>
  );
}
