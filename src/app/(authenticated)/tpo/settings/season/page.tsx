import { Disclosure } from "@/components/ui/disclosure";
import { StatTile } from "@/components/ui/stat-tile";
import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { TpoSeasonControls } from "@/components/placements/tpo-season-controls";
import { TpoSeasonRegistrationControls } from "@/components/placements/tpo-season-registration-controls";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoPlacementSeasonSettings } from "@/modules/placements/tpo-settings-read-service";

export default async function TpoPlacementSeasonSettingsPage() {
  const context = await getCurrentRequestContext();

  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }

  const { seasons, summary } =
    await getTpoPlacementSeasonSettings(context);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Placement Season" />
      <TpoSettingsNav active="season" compact />

      <section className="space-y-2">
        <p className="text-sm leading-[22px] text-body">
          College-specific placement seasons and their
          recorded dates and lifecycle status. A season
          marked ACTIVE is not necessarily open for
          learner registration: registration is separately
          controlled per academic cohort.
        </p>
      </section>

      <TpoSeasonControls seasons={seasons} />
      <TpoSeasonRegistrationControls seasons={seasons} />
      <Disclosure title="Season totals" className="min-w-0" contentClassName="pt-3">
      <div
        aria-label="Season summary"
        className="grid min-w-0 grid-cols-1 gap-3 min-[768px]:grid-cols-2 min-[992px]:grid-cols-3"
      >
        {[
          {
            label: "Total seasons",
            value: summary.total,
          },
          {
            label: "Active",
            value: summary.active,
          },
          {
            label: "Closed",
            value: summary.closed,
          },
        ].map((metric) => (
          <StatTile {...(tpoTileStyles["tile"] !== undefined ? { className: tpoTileStyles["tile"] } : {})} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>
      </Disclosure>

      {seasons.length === 0 ? (
        <EmptyState
          title="No placement seasons"
          description="This college has no recorded placement seasons. No season status or registration availability is inferred."
        />
      ) : (
        <section className="space-y-4">
          {seasons.map((season) => (
            <article
              key={season.id}
              className="border-b border-border py-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="m-0 text-[16px] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">
                    {season.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-5">
                    Code: {season.code}
                  </p>
                </div>
                <StatusBadge
                  tone={
                    season.status === "ACTIVE"
                      ? "success"
                      : "neutral"
                  }
                >
                  {season.status === "ACTIVE"
                    ? "Active"
                    : "Closed"}
                </StatusBadge>
              </div>

              <dl className="mt-4 grid gap-4 min-[768px]:grid-cols-2 min-[992px]:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">
                    Start date
                  </dt>
                  <dd className="mt-1 text-sm text-body">
                    <time dateTime={season.startDate}>
                      {season.startDate}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">
                    End date
                  </dt>
                  <dd className="mt-1 text-sm text-body">
                    <time dateTime={season.endDate}>
                      {season.endDate}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">
                    Registration window
                  </dt>
                  <dd className="mt-1 text-sm text-body">
                    {!season.registrationControlled?"Managed per invited cohort":
                      season.isRegistrationOpen && (!season.registrationDeadline || new Date(season.registrationDeadline).getTime()>Date.now())
                        ?"Open"+(season.registrationDeadline?" until "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(season.registrationDeadline))+" IST":""):
                        "Closed"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">
                    Lifecycle status
                  </dt>
                  <dd className="mt-1 text-sm text-body">
                    {season.status}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
      )}

      <Disclosure title="Season data and registration notes" className="min-w-0" contentClassName="pt-2">
      <p className="text-xs leading-5 text-muted-foreground">
        Source: persisted placement_seasons records.
        Registration is controlled independently of season dates and
        requires an explicit versioned, audited TPO action. A season marked
        Active does not automatically invite a cohort: learner eligibility
        and batch registration deadlines are enforced separately.
        Closing the season also closes season registration.
      </p>
      </Disclosure>
    </div>
  );
}
