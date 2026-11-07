"use client";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerVerificationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="min-w-0 space-y-4">
      <PageHeader title="Verification status unavailable" />
      <p className="max-w-2xl text-sm leading-6 text-body">
        Please retry. A load failure does not mean a verification was rejected.
      </p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={reset} className="min-h-11 w-full sm:w-auto">Retry</Button>
        <ButtonLink variant="secondary" href="/learn/profile" className="w-full sm:w-auto">Back to my profile</ButtonLink>
      </div>
    </section>
  );
}
