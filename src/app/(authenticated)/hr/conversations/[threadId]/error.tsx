"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function ErrorView({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="space-y-4 border-b border-border pb-6">
    <PageHeader title="Unable to load conversation" />
    <p className="text-sm text-body">Message history could not be read. This does not mean there are no messages.</p>
    <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
  </section>;
}
