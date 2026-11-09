"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";
export default function CollegeBatchPromotionError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <div className="min-w-0 space-y-4"><PageHeader title="Batch promotion"/><ErrorState title="Batch promotion preview unavailable"
    description="The persisted progression or learner data could not be loaded; no readiness conclusion is assumed."
    action={<><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><ButtonLink href="/college/batches" variant="secondary">Back to batches</ButtonLink></>} /></div>;
}
