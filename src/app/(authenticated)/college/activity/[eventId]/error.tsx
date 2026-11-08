"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";
export default function CollegeActivityDetailError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Activity detail unavailable"
    description="The requested event cannot be shown. It may be outside the permitted college scope."
    action={<div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>
      <TextLink href="/college/activity" className="inline-flex min-h-11 items-center">Back to Activity Log</TextLink>
    </div>} />;
}
