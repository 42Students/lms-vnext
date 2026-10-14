"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function StudentImportError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <ErrorState title="Student importer unavailable"
    description="The importer could not load. No identities or enrollments were changed by this error screen."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Retry
    </button>} />;
}
