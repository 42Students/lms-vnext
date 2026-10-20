import { StatTile } from "@/components/ui/stat-tile";
import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { TpoSeasonControls } from "@/components/placements/tpo-season-controls";
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
    <div className="space-y-6">
      <TpoSettingsNav active="season" />

      <section className="space-y-2">
        <PageHeader title="Placement Season" />
        <p className="text-sm leading-6 text-body">
          College-specific placement seasons and their
          recorded dates and lifecycle status. A season
          marked ACTIVE is not necessarily open for
          learner registration: registration is separately
          controlled per academic cohort.
        </p>
      </section>

      <div
        aria-label="Season summary"
        className="grid gap-3 min-[768px]:grid-cols-3"
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
          <StatTile className={tpoTileStyles.tile} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>

      <TpoSeasonControls seasons={seasons} />

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
                  <h3 className="m-0 text-lg font-semibold text-foreground">
                    {season.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
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

              <dl className="mt-4 grid gap-4 min-[768px]:grid-cols-2 lg:grid-cols-3">
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

      <p className="text-xs leading-5 text-muted-foreground">
        Source: persisted placement_seasons records.
        No registration deadline, blocked academic dates,
        or open-registration state is inferred from the
        season dates. Creating and editing the active season now require
        confirmation. Closing uses the existing season lifecycle; registration-opening
        remains unavailable until the registration lifecycle is verified.
      </p>
    </div>
  );
}
