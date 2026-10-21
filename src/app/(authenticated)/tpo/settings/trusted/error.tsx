"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function TpoTrustedCompaniesError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState
    title="Couldn't load Trusted Companies"
    description="Company relationships and trusted-domain records could not be retrieved. No trust state or empty allowlist is inferred from this failure."
    action={<Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>}
  />;
}
