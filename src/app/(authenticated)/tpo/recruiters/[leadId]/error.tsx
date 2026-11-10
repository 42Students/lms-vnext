"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load recruiter details"
    description="This recruiter's details could not be retrieved. This does not confirm that the recruiter is missing or no longer associated with the college."
    action={<div className="flex min-w-0 flex-wrap gap-2">
      <Button variant="secondary" type="button" onClick={reset} className="min-h-11 w-full sm:w-auto md:min-h-9">Retry details</Button>
      <ButtonLink variant="secondary" href="/tpo/recruiters" className="min-h-11 w-full sm:w-auto md:min-h-9">All recruiters</ButtonLink>
    </div>}
  />;
}
