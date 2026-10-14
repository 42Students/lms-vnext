"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function AdminAssignmentsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Could not load assignments" description="The scoped assignment directory is unavailable." action={<Button onClick={reset}>Retry</Button>} />;
}
