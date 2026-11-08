"use client";
import { ButtonLink } from "@/components/ui/button-link";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="min-w-0 space-y-4"><ErrorState
    title="\n        Couldn't load Jobs · Joining\n      "
    description="The requested records could not be retrieved. A load failure does not\n        mean there are no records or that a reported total is zero."
    action={<Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>}
  />
  <ButtonLink variant="secondary" href="/tpo/placements" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9">Back to placements</ButtonLink>
  </section>;
}
