"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export default function LearnerProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="min-w-0 space-y-4">
      <PageHeader title="We couldn't load your profile. Please try again." />
      <p className="mt-2 max-w-2xl text-sm leading-6 text-body">
        We couldn't load your profile. Please try again. Your previously saved details were not overwritten.
      </p>
      <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
        <ButtonLink variant="secondary" href="/learn/courses" className="w-full sm:w-auto">Courses</ButtonLink>
      </div>
    </section>
  );
}
