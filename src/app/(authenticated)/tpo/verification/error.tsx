"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageBackLink } from "@/components/ui/page-back-link";

export default function TpoVerificationError({ reset }: { reset: () => void }) {
 return <ErrorState title="Could not load verification"
  description="This information is temporarily unavailable. Your filters are still selected."
  action={<><Button type="button" variant="secondary" onClick={reset}>Retry verification</Button>
   <PageBackLink href="/tpo/students" label="Back to students" /></>} />;
}
