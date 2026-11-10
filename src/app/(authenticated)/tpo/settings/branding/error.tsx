"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";

export default function TpoPlacementBrandingError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load placement branding"
      description="The college's branding records could not be retrieved. No logo, colour, or fallback value has been inferred from this error."
      action={<div className="flex min-w-0 flex-wrap gap-2">
        <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry branding</Button>
        <ButtonLink variant="secondary" href="/tpo/settings" className="min-h-11 w-full sm:w-auto md:min-h-9">Placement settings</ButtonLink>
      </div>}
    />
  );
}
