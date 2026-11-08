"use client";
import { ButtonLink } from "@/components/ui/button-link";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="min-w-0 space-y-4"><ErrorState
    title="Couldn't load round results"
    description="A failed read does not mean a learner has no results."
    action={<Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>}
  />
  <ButtonLink variant="secondary" href="/tpo/placements" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9">Back to placements</ButtonLink>
 </section>;
}
