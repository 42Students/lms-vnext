"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Audience preview unavailable"
    description="The campaign audience could not be verified. No recipients have been confirmed by this preview; review the campaign before sending."
    action={<div className="flex min-w-0 flex-wrap gap-2">
      <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry preview</Button>
      <ButtonLink variant="secondary" href="/tpo/recruiters/campaigns" className="min-h-11 w-full sm:w-auto md:min-h-9">Campaigns</ButtonLink>
    </div>}
  />;
}
