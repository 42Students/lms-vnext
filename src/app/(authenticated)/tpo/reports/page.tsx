import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import {legacyTpoReportCard,TPO_LEGACY_REPORT_GALLERY_DESCRIPTION} from "@/modules/placements/tpo-legacy-report-copy";
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
import {filterTpoReportGallery,tpoReportGallerySearchSchema,tpoReportGalleryGroupSchema,TPO_REPORT_GALLERY_GROUPS,countVisibleTpoReportCards,alphabetizeTpoReportGallery} from "@/modules/placements/tpo-report-gallery-filter-model";

type SearchParams = {
  seasonId?: string | string[];
  jobId?: string | string[];
  q?: string | string[];
  group?: string | string[];
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
  const parsedSearch=tpoReportGallerySearchSchema.safeParse(first(query.q)??"");
  const parsedGroup=tpoReportGalleryGroupSchema.safeParse(first(query.group)??"ALL");
  if(!parsedSearch.success||!parsedGroup.success)return <section role="alert"
    className="border-t border-border py-6">
    <h1 className=" text-[26px] font-semibold text-[var(--lms-heading)] sm:text-[30px]">Invalid report search</h1>
    <p className="mt-2 text-sm text-body">Enter up to 80 characters to filter reports.</p>
    <Link href="/tpo/reports" className="mt-3 inline-flex min-h-11 sm:min-h-9 items-center text-link underline">
      Clear search
    </Link>
  </section>;
  // TPO-calendar-reports-55: do not mistake a failed snapshot for zero placements.
  let workspace: Awaited<ReturnType<typeof getPlacementReportWorkspace>>;
  try {
    workspace = await getPlacementReportWorkspace(context, {
      collegeId: context.membership.collegeId,
      seasonId: first(query.seasonId) || undefined,
      jobId: first(query.jobId) || undefined,
    });
  } catch {
    return <div className="min-w-0 space-y-6">
      <PageHeader eyebrow="TPO · Reports" title="Reports"
        description={TPO_LEGACY_REPORT_GALLERY_DESCRIPTION} />
      <section role="alert" className="border-l-[3px] border-warning-border bg-warning-subtle px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">The headline numbers could not be loaded.</h2>
        <p className="mt-2 text-sm text-body">The report is temporarily unavailable. No placement totals are being inferred from missing data.</p>
        <Link href="/tpo/reports" className="mt-3 inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link">Retry</Link>
      </section>
    </div>;
  }

  const groups = [
    {
      heading: "Overview and performance",
      description: "Start with the college-wide picture, then compare branches, companies and compensation.",
      cards: [
        {
          title: "Placement summary",
          description:
            "Management view of placement outcomes, drive funnels and company performance.",
          path: "/tpo/reports/placement-summary",
        },
        {
          title: "Placed students by branch",
          description: "Season-scoped unique placed and confirmed joined learners, with current academic branch and capped CSV.",
          path: "/tpo/reports/placed-branch",
        },
        {
          title: "Season pipeline",
          description: "Recorded applied, shortlisted, offer and joining stages, with unavailable final selection and capped CSV.",
          path: "/tpo/reports/season-pipeline",
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
      heading: "Offers, joining and readiness gaps",
      description:
        "Understand who is still unplaced, what happened to offers, and where students are dropping out of the funnel.",
      cards: [
        {
          title: "Unplaced students",
          description:
            "Current registered placement-pool learners without an accepted offer in the selected reporting scope.",
          path: "/tpo/reports/unplaced",
        },
        {
          title: "After college",
          description:"Student-reported higher studies, entrepreneurship, competitive examinations and job-search destinations, by batch and branch.",
          path:"/tpo/reports/after-college",
        },
        {
          title: "Offer expiry watchlist",
          description: "Currently issued offers expiring in a validated IST day window, with safe capped CSV.",
          path: "/tpo/reports/offers-expiry",
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
      heading: "Recruiter funnel and accreditation",
      description:
        "Measure employer engagement and export the formal data required for accreditation workflows.",
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

  const legacyGroups=groups.map(group=>({...group,cards:group.cards.map(legacyTpoReportCard)}));
  const visibleGroups = alphabetizeTpoReportGallery(filterTpoReportGallery(legacyGroups,parsedSearch.data,parsedGroup.data));
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Insights"
        title="Reports"
        description={TPO_LEGACY_REPORT_GALLERY_DESCRIPTION}
        actions={
          <Link
            href={reportHref("/tpo/reports/placement-summary", workspace)}
            className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-[650] text-white"
          >
            Open management view
          </Link>
        }
      />

      <ReportFilters workspace={workspace} userId={context.user.id} path="/tpo/reports" />
      <ReportMetrics metrics={workspace.report.metrics} />
      <ReportScopeNote note={workspace.registrationScopeNote} />
      <nav aria-label="Placement journey" className="space-y-2 border-t border-border pt-5">
       <h2 className="font-semibold">Placement journey</h2>
       <p className="text-sm text-body">{workspace.report.metrics.offers} offers made across the selected season and drive scope.</p>
       <div className="grid gap-3 sm:grid-cols-3">
        <Link href={reportHref("/tpo/reports/unplaced",workspace)} className="rounded-[var(--lms-control-radius)] border border-border p-3">
         <strong className="block">Looking for a job</strong>
         <span className="text-sm">{workspace.report.metrics.registered} registered · {Math.max(0,workspace.report.metrics.registered-workspace.report.metrics.studentsPlaced)} not placed</span>
        </Link>
        <Link href={reportHref("/tpo/reports/placed-branch",workspace)} className="rounded-[var(--lms-control-radius)] border border-border p-3">
         <strong className="block">Placed</strong>
         <span className="text-sm">{workspace.report.metrics.studentsPlaced} students under the college&apos;s placement rule</span>
        </Link>
        <Link href={reportHref("/tpo/reports/offers-acceptance",workspace)} className="rounded-[var(--lms-control-radius)] border border-border p-3">
         <strong className="block">Accepted</strong>
         <span className="text-sm">{workspace.report.metrics.acceptedOffers} accepted offers · {Math.max(0,workspace.report.metrics.offers-workspace.report.metrics.acceptedOffers)} not yet accepted</span>
        </Link>
       </div>
       <p className="text-xs text-muted-foreground">These are different populations: registered learners, placement-rule students, and offer records. Do not interpret their counts as a single conversion funnel.</p>
      </nav>


      {workspace.noSeason ? (
        <EmptyState
          title="No placement season available"
          description="Create a placement season before reviewing season-level outcomes. No placement performance is inferred without a season."
        />
      ) : null}

      <form method="get" action="/tpo/reports"
        className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
        {workspace.selectedSeasonId?<input type="hidden" name="seasonId" value={workspace.selectedSeasonId}/>:null}
        {workspace.selectedJobId?<input type="hidden" name="jobId" value={workspace.selectedJobId}/>:null}
        <label className="grid min-w-0 flex-1 gap-2 text-sm font-semibold text-body">
          Find a report
          <Input type="search" name="q" maxLength={80} defaultValue={parsedSearch.data}
            placeholder="Report name or purpose"
            className="min-h-11 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3"/>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-body">Report category
          <Select name="group" defaultValue={parsedGroup.data}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3">
            {TPO_REPORT_GALLERY_GROUPS.map(group=><option key={group} value={group}>
              {group==="ALL"?"All report categories":group}
            </option>)}
          </Select>
        </label>
        <Button type="submit" className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 font-[650] text-white">Search</Button>
        <Link href={reportHref("/tpo/reports",workspace)}
          className="inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-link underline">
          Clear
        </Link>
      </form>
      <p role="status" className="text-sm text-body">{countVisibleTpoReportCards(visibleGroups)} matching reports in the selected scope.</p>
      {visibleGroups.length===0?<EmptyState title="No matching reports"
        description="No available report matches this search and category. Clear filters to see the full gallery."/>:null}
      {visibleGroups.map((group) => (
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
                  className="block border-b border-border py-5 transition hover:border-primary hover:bg-primary-subtle"
                >
                  <h3 className="font-semibold text-link">
                    {card.title}
                  </h3>
                  {card.path==="/tpo/reports/placement-summary"?<p className="mt-1 text-xs font-semibold text-link">Start here</p>:null}
                  <p className="mt-2 text-sm leading-6 text-body">
                    {card.description}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-link">
                    Open report →
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface-subtle p-4 text-sm text-body">
              These additional report types are not yet implemented. No
              unavailable reports are presented as working links.
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
