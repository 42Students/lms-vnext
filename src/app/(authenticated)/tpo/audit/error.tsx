"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

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
      <ErrorState
        title="Could not load the audit log"
        description="Persisted audit records could not be retrieved. No missing records or zero-event conclusion is inferred from this error."
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
