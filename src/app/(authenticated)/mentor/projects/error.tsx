"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function MentorProjectsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Projects could not be loaded"
    description="Check your connection and try again. This does not mean Projects is disabled."
    action={<Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>}
  />;
}
