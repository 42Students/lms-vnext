import { notFound } from "next/navigation";
import { TpoReportInvalidFilters } from "@/components/placements/tpo-report-invalid-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";
import { Heading } from "@/components/ui/heading";

import { env } from "@/config/env";
export const dynamic = "force-dynamic";

/** Synthetic text and routes only; never serves in a production build. */
export default function TpoRecoveryFixture() {
  if (process.env.NODE_ENV !== "development" ||
      env.UX_TPO_G110_G119_FIXTURE !== "1") notFound();

  return (
    <main id="lms-main-content" className="mx-auto w-full max-w-4xl min-w-0 space-y-8 px-4 py-6 md:px-8">
      <Heading level={1} className="text-xl font-bold">TPO recovery UX acceptance</Heading>
      <section aria-label="Invalid report filter recovery" className="min-w-0 border-b border-border pb-5">
        <TpoReportInvalidFilters path="/tpo/reports/after-college" />
      </section>
      <section aria-label="Empty joining season" className="min-w-0 border-b border-border pb-5">
        <EmptyState title="No placement season"
          description="Joining follow-ups require a recorded placement season. No joining outcomes are inferred."
          action={<ButtonLink variant="secondary" href="/tpo/settings/season">Review placement seasons</ButtonLink>} />
      </section>
      <section aria-label="Invalid team sort recovery" className="min-w-0 border-b border-border pb-5">
        <ErrorState title="Invalid team sorting"
          description="The link contains an unknown or repeated team sort. No team records were loaded."
          action={<ButtonLink variant="secondary" href="/tpo/settings/team">Clear sort</ButtonLink>} />
      </section>
      <section aria-label="Unavailable blocked dates" className="min-w-0 border-b border-border pb-5">
        <ErrorState title="Blocked dates could not be verified"
          description="Editing is unavailable. Existing dates may still be recorded."
          action={<ButtonLink variant="secondary" href="/tpo/settings/blocked-dates">Try loading dates again</ButtonLink>} />
      </section>
    </main>
  );
}
