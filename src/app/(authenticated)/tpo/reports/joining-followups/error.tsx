"use client";

import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load joining follow-ups"
    description="The report is unavailable; this is not evidence of completed joinings."
    action={<div className="flex min-w-0 flex-wrap items-center gap-3"><Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto sm:min-h-9" onClick={reset}>Retry</Button><TextLink href="/tpo/reports" className="inline-flex min-h-11 items-center md:min-h-9">All reports</TextLink></div>}
  />;
}
