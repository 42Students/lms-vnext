"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function TpoHomeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Could not load Home" description="Something went wrong while loading this content. Your current context has been kept."
    action={<Button variant="secondary" onClick={reset}>Retry</Button>} />;
}
