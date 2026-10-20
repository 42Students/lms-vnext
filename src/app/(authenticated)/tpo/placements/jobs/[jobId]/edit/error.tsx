"use client";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

/** TPO-drives-49: a failed read is not an editable draft or a destructive reset. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4">
    <PageHeader
      title="Some drive setup data could not be loaded"
      actions={<PageBackLink href="/tpo/placements/lifecycle" label="Back to drives" />}
    />
    <Alert tone="error">
      <p className="text-sm text-body">No changes were saved. Retry loading this drive, or return to the drive list.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={reset}>Retry</Button>
      </div>
    </Alert>
  </div>;
}
