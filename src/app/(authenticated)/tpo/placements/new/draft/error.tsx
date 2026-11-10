"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load draft drive setup"
    description="Employer and season options could not be loaded. No empty selection is assumed."
    action={<div className="flex min-w-0 flex-wrap gap-2">
      <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry draft</Button>
      <ButtonLink variant="secondary" href="/tpo/placements/new" className="min-h-11 w-full sm:w-auto md:min-h-9">Start a new drive</ButtonLink>
    </div>}
  />;
}
