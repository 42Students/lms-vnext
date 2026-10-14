import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  ReportFilters,
  ReportMetrics,
  ReportScopeNote,
  reportHref,
} from "@/components/placements/placement-report-ui";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementReportWorkspace } from "@/modules/placements/report-service";

type SearchParams = {
  seasonId?: string | string[];
  jobId?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }

  const query = await searchParams;
  const workspace = await getPlacementReportWorkspace(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(query.seasonId) || undefined,
    jobId: first(query.jobId) || undefined,
  });

  const groups = [
    {
      heading: "Overview and performance",
      description: "Season outcomes, applications, offers and placement performance.",
      cards: [
        {
          title: "Placement summary",
          description:
            "Management view of placement outcomes, drive funnels and company performance.",
          path: "/tpo/reports/placement-summary",
        },
        {
          title: "Company funnel & compensation intelligence",
          description: "Persisted applicant denominators and offer-versus-learner CTC measures, with CSV.",
          path: "/tpo/reports/intelligence",
        },
        {
          title: "By branch",
          description:
            "Compare registered students, applications, placements and packages across departments.",
          path: "/tpo/reports/by-branch",
        },
        {
          title: "CTC",
          description:
            "Explore annual compensation bands for accepted full-time offers.",
          path: "/tpo/reports/ctc",
        },
      ],
    },
    {
      heading: "Student outcomes",
      description:
        "Unplaced placement-pool learners, offer decisions and recorded joining outcomes.",
      cards: [
        {
          title: "Unplaced students",
          description:
            "Current registered placement-pool learners without an accepted offer in the selected reporting scope.",
          path: "/tpo/reports/unplaced",
        },
        {
          title: "Offers & acceptance",
          description:
            "Current issued, accepted, declined, withdrawn and expiry-derived outstanding offers.",
          path: "/tpo/reports/offers-acceptance",
        },
        {
          title: "Joining outcomes",
          description:
            "Joined, deferred, did-not-join and pending outcomes for accepted offers.",
          path: "/tpo/reports/joining-status",
        },
        {
          title: "Failure reasons",
          description:
            "Persisted rejection, round failure, withdrawal and offer-decline reasons, grouped by reason and drive.",
          path: "/tpo/reports/failure-reasons",
        },
      ],
    },
    {
      heading: "Relationships and compliance",
      description:
        "Company-level placement outcomes and performance.",
      cards: [
        {
          title: "By company",
          description:
            "Company-wise drives, offers, unique placed learners and accepted full-time packages.",
          path: "/tpo/reports/by-company",
        },
        {
          title: "Leads report",
          description:
            "College-wide recruiter leads by manual stage and source, with observed invite and recruiter-account linkage counts.",
          path: "/tpo/reports/leads",
        },
        {
          title: "Accreditation export",
          description:
            "Download a season-scoped, formula-safe CSV of observed placement outcomes with explicit completeness warnings; not a certified NAAC/NIRF template.",
          path: "/tpo/reports/accreditation",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Insights"
        title="Reports"
        description="Explore read-only placement performance inside your college."
        actions={
          <Link
            href={reportHref("/tpo/reports/placement-summary", workspace)}
            className="inline-flex min-h-10 items-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary"
          >
            Open management view
          </Link>
        }
      />

      <ReportFilters workspace={workspace} path="/tpo/reports" />
      <ReportMetrics metrics={workspace.report.metrics} />
      <ReportScopeNote note={workspace.registrationScopeNote} />

      {workspace.noSeason ? (
        <EmptyState
          title="No placement season available"
          description="Create a placement season before reviewing season-level outcomes. No placement performance is inferred without a season."
        />
      ) : null}

      {groups.map((group) => (
        <section key={group.heading} className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {group.heading}
            </h2>
            <p className="mt-1 text-sm leading-6 text-body">
              {group.description}
            </p>
          </div>

          {group.cards.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {group.cards.map((card) => (
                <Link
                  key={card.path}
                  href={reportHref(card.path, workspace)}
                  className="block rounded-xl border border-border bg-surface p-5 transition hover:border-primary hover:bg-primary-subtle"
                >
                  <h3 className="font-semibold text-primary-text">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-body">
                    {card.description}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-primary-text">
                    Open report →
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface-subtle p-4 text-sm text-body">
              These additional report types are not yet implemented. No
              unavailable reports are presented as working links.
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
