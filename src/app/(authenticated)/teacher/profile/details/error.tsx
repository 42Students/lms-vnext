"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function FacultyProfileDetailsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Faculty profile could not load" description="Your previous information has not been changed."
    action={<Button variant="secondary" onClick={reset}>Retry</Button>} />;
}
