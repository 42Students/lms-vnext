"use client";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function ErrorView({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Alert tone="error" className="space-y-4">
    <PageHeader title="Conversations unavailable" />
    <p className="text-sm text-body">Your employer messages could not be loaded.</p>
    <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
  </Alert>;
}
