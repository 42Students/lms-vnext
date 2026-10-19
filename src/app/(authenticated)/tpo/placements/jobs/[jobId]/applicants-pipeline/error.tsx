"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Couldn’t load applicant pipeline" description="Failed retrieval does not mean no applicants exist." action={<Button variant="secondary" type="button" onClick={reset}>Retry</Button>} />;
}
