"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Drives unavailable" description="The drives could not be loaded; this is not an empty-list conclusion."
    action={<button type="button" onClick={reset}>Retry</button>} />;
}
