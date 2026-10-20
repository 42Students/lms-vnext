"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function TpoPlacementBrandingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="space-y-3 py-6"
    >
      <PageHeader title={"Couldn't load placement branding"} />

      <ErrorState title="Couldn't load placement branding"
        description="The college's branding records could not be retrieved. No logo, colour, or fallback value has been inferred from this error."
        action={<Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>}/>
    </section>
  );
}
