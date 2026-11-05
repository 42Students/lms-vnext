"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load Placements"
    description="The requested records could not be retrieved. A load failure does not mean there are no records or that a reported total is zero."
    action={<>
      <Button type="button" onClick={reset} className="w-full sm:w-auto">Retry</Button>
      <ButtonLink variant="secondary" href="/tpo/placements/lifecycle" className="w-full sm:w-auto">Drive lifecycle</ButtonLink>
    </>}
  />;
}
