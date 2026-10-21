"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** Initial audit loads fail visibly; never turn a failed query into no events. */
export default function AuditError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section className="min-w-0 space-y-4">
    <PageHeader eyebrow="Super Admin" title="Audit Logs" />
    <Alert tone="error">
      <p>Failed to load audit logs. Please try again.</p>
      <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
    </Alert>
  </section>;
}
