"use client";

import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export default function StudentImportError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <div className="min-w-0 space-y-6"><PageHeader title="Import students" /><ErrorState title="Student importer unavailable"
    description="The importer could not load. No identities or enrollments were changed by this error screen."
    action={<div className="flex flex-col gap-2 sm:flex-row"><Button type="button" variant="secondary" className="min-h-11" onClick={reset}>Retry</Button><ButtonLink variant="secondary" href="/college/students">Student directory</ButtonLink></div>} /></div>;
}
