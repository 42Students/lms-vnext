"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function GroupCsvPreviewError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <ErrorState title="Group import preview unavailable"
    description="The validation source could not be checked. No rows were changed."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Retry</button>} />;
}
