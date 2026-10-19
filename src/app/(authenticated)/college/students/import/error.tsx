"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function StudentImportError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <ErrorState title="Student importer unavailable"
    description="The importer could not load. No identities or enrollments were changed by this error screen."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>} />;
}
