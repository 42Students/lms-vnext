"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Offers could not be loaded" description="Please try again. Your existing offer records have not been changed." action={<Button variant="secondary" type="button" onClick={reset}>Retry</Button>} />;
}
