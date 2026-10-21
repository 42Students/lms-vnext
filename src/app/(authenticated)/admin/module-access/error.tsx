"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** A scoped read failure cannot be shown as an empty hierarchy. */
export default function ModuleAccessError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Module Access" />
    <Alert tone="error">
      <p>Couldn't load module access. Could not load module access.</p>
      <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
    </Alert>
  </section>;
}
