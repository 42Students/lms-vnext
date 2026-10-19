"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function ErrorView({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="space-y-4 border-b border-border pb-6">
    <PageHeader title="Unable to load conversation" />
    <Alert tone="error">
      <p>Message history could not be read. This does not mean there are no messages.</p>
      <div><Button type="button" variant="secondary" onClick={reset}>Retry</Button></div>
    </Alert>
  </section>;
}
