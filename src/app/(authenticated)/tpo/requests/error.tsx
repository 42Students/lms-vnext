"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";

export default function TpoRequestsError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="Could not load requests"
      description="Requests are temporarily unavailable. Your selected filters will be kept when you retry."
      action={
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Button variant="secondary" type="button" className="min-h-11 md:min-h-9" onClick={reset}>
            Retry requests
          </Button>
          <TextLink href="/tpo/students" className="inline-flex min-h-11 items-center md:min-h-9">
            Back to students
          </TextLink>
        </div>
      }
    />
  );
}
