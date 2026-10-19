"use client";
import { ErrorState } from "@/components/ui/error-state";
import {Button} from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Drive overview unavailable" description="Could not load persisted drive data. Counts have not been replaced with zero."
    action={<Button variant="ghost" type="button" onClick={reset}>Retry</Button>} />;
}
