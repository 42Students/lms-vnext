"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import JobError from "@/app/(authenticated)/learn/my-placements/jobs/[jobId]/error";
import PreferencesError from "@/app/(authenticated)/learn/my-placements/notification-preferences/error";
import CalendarError from "@/app/(authenticated)/learn/my-placements/calendar/error";
import InterviewError from "@/app/(authenticated)/learn/my-placements/interviews/error";
import OffersError from "@/app/(authenticated)/learn/my-placements/offers/error";
import JobLoading from "@/app/(authenticated)/learn/my-placements/jobs/[jobId]/loading";
import OffersLoading from "@/app/(authenticated)/learn/my-placements/offers/loading";

export function LearnerPlacementJourneyHarness() {
  const [attempts, setAttempts] = useState(0);
  const reset = () => setAttempts(count => count + 1);
  const error = new Error("PRIVATE_ERROR_DO_NOT_DISPLAY");

  return <main className="mx-auto w-full max-w-4xl min-w-0 space-y-8 p-4 md:p-6">
    <PageHeader title="Learner placement recovery"
      description="Synthetic UX states; no private learner or placement records." />
    <section role="region" aria-label="Job detail recovery" className="min-w-0 space-y-3">
      <JobError error={error} reset={reset} />
      <p role="status" data-testid="placement-retry-count">Retry attempts: {attempts}</p>
    </section>
    <section role="region" aria-label="Notification preference recovery"
      className="min-w-0 space-y-3">
      <PreferencesError error={error} reset={reset} />
    </section>
    <section role="region" aria-label="Calendar and interview recovery"
      className="min-w-0 space-y-4">
      <CalendarError error={error} reset={reset} />
      <InterviewError error={error} reset={reset} />
    </section>
    <section role="region" aria-label="Offer recovery" className="min-w-0 space-y-3">
      <OffersError error={error} reset={reset} />
    </section>
    <section role="region" aria-label="Placement loading states" className="min-w-0 space-y-4">
      <JobLoading />
      <OffersLoading />
    </section>
  </main>;
}
