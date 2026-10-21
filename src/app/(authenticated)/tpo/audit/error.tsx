"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {Banner} from "@/components/ui/banner";

export default function TpoAuditError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Oversight"
        title="Audit Log"
      />
      <Banner tone="warning">This refresh failed. Showing the last successful load if it remains available in the current view. Retry to refresh the audit log.</Banner>
      <ErrorState
        title="Could not load the audit log"
        description="The audit log could not be loaded. No missing records or zero-event conclusion is inferred from this error."
        action={
          <Button
            variant="secondary"
            onClick={reset}
          >
            Retry
          </Button>
        }
      />
    </div>
  );
}
