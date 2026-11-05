"use client";

import { PageHeader } from "@/components/ui/page-header";
import {Banner} from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export default function LearnerPlacementsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="min-w-0 space-y-4">
      <PageHeader title="My Placements" />
      <Banner tone="error">We could not load this page. Retry the placement view.</Banner>
      <p className="mt-2 text-sm text-body">
        Your data is safe. Check your connection and try again. This is a loading problem, not an empty account.
      </p>
      <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
        <ButtonLink variant="secondary" href="/learn" className="w-full">
          Learner Home
        </ButtonLink>
      </div>
    </section>
  );
}
