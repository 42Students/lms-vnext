"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function ErrorPage({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section role="alert" className="min-w-0 space-y-4">
    <PageHeader title={"Couldn't load Reports · Unplaced"} />
    <ErrorState title="Couldn't load Reports · Unplaced"
      description="The requested records could not be retrieved. A load failure does not mean there are no records or that a reported total is zero."
      action={<Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>} />
  </section>;
}
