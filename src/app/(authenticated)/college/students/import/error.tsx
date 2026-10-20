"use client";

import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function StudentImportError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <div className="min-w-0 space-y-6"><PageHeader title="Import students" /><ErrorState title="Student importer unavailable"
    description="The importer could not load. No identities or enrollments were changed by this error screen."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>} /></div>;
}
