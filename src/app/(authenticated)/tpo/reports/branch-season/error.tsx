"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load branch evidence"
    description="Persisted season, offer or application evidence could not be read. Missing data is not interpreted as a zero placement rate."
    action={<div className="flex min-w-0 flex-wrap items-center gap-3"><Button variant="secondary" type="button" className="w-full min-h-11 sm:w-auto md:min-h-9" onClick={reset}>Retry</Button><TextLink href="/tpo/reports" className="inline-flex min-h-11 items-center md:min-h-9">All reports</TextLink></div>}
  />;
}
