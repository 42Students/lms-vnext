"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";

/** Initial audit loads fail visibly; never turn a failed query into no events. */
export default function AuditError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section className="min-w-0 space-y-4">
    <PageHeader eyebrow="Super Admin" title="Audit Logs" />
    <Alert tone="error">
      <p>Audit events could not be verified. No empty or partial history is shown while this request has failed.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={reset}>Retry audit log</Button>
        <TextLink href="/admin" className="inline-flex min-h-11 items-center md:min-h-9">Back to Super Admin</TextLink>
      </div>
    </Alert>
  </section>;
}
