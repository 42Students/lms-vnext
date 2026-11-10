"use client";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";

/** G117: this is a failed configuration read, not proof that no share link exists. */
export default function RouteError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState
    title="Couldn't load the public placement link"
    description="The public link settings could not be retrieved. The link may still be active; no published or disabled state is inferred."
    action={<div className="flex min-w-0 flex-wrap gap-2">
      <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry link settings</Button>
      <ButtonLink href="/tpo/settings" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">Placement settings</ButtonLink>
    </div>}
  />;
}
