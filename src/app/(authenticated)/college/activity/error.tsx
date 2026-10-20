"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function CollegeActivityError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Activity Log unavailable"
    description="College activity could not be loaded. An empty result is not assumed."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>} />;
}
