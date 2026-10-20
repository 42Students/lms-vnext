"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function ErrorView({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Private messages unavailable" description="No conversation content could be loaded."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>} />;
}
