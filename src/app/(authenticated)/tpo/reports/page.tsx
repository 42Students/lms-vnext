import { Select } from "@/components/ui/select";
import { tpoReportHasAmbiguousFilters } from "@/modules/placements/tpo-report-url-guard";
import { TpoReportInvalidFilters } from "@/components/placements/tpo-report-invalid-filters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import {legacyTpoReportCard,TPO_LEGACY_REPORT_GALLERY_DESCRIPTION} from "@/modules/placements/tpo-legacy-report-copy";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Disclosure } from "@/components/ui/disclosure";
import {
  ReportFilters,
  ReportMetrics,
  ReportScopeNote,
  reportHref,
} from "@/components/placements/placement-report-ui";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementReportWorkspace } from "@/modules/placements/report-service";
import {filterTpoReportGallery,tpoReportGallerySearchSchema,tpoReportGalleryGroupSchema,TPO_REPORT_GALLERY_GROUPS,countVisibleTpoReportCards} from "@/modules/placements/tpo-report-gallery-filter-model";

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
  if (tpoReportHasAmbiguousFilters(query)) return <TpoReportInvalidFilters path="/tpo/reports" />;
  const parsedSearch=tpoReportGallerySearchSchema.safeParse(first(query.q)??"");
  const parsedGroup=tpoReportGalleryGroupSchema.safeParse(first(query.group)??"ALL");
  if(!parsedSearch.success||!parsedGroup.success)return <section className="min-w-0 space-y-3">
    <PageHeader title="Invalid report search" />
    <Alert tone="error">
    <p className="mt-2 text-sm text-body">Enter up to 80 characters to filter reports.</p>
    <Link href="/tpo/reports" className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-link underline lms-inline-link">
      Clear search
    </Link>
    </Alert>
  </section>;
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
          path:"/tpo/reports/outcomes",
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
          path: "/tpo/reports/recruiter-leads",
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

  // TPO-calendar-reports-55: do not mistake a failed snapshot for zero placements.
  let workspace: Awaited<ReturnType<typeof getPlacementReportWorkspace>> | null = null;
  try {
    workspace = await getPlacementReportWorkspace(context, {
      collegeId: context.membership.collegeId,
      seasonId: first(query.seasonId) || undefined,
      jobId: first(query.jobId) || undefined,
    });
  } catch {
    // Snapshot failures must not hide the static reporting destinations.
    // Never display invented metric totals when the read failed.
  }

  const legacyGroups=groups.map(group=>({...group,cards:group.cards.map(legacyTpoReportCard)}));
  // Keep legacy's intentional report order: placement health, outcomes, relationships.
  const visibleGroups = filterTpoReportGallery(legacyGroups,parsedSearch.data,parsedGroup.data);
  if (!workspace) {
    return <div className="min-w-0 space-y-6">
      <PageHeader title="Reports" description={TPO_LEGACY_REPORT_GALLERY_DESCRIPTION} />
      <Alert tone="error">
        <h2 className="text-base font-semibold">The headline numbers could not be loaded.</h2>
        <p className="mt-2 text-sm text-body">Previously loaded figures cannot be verified in this request. The report links remain available.</p>
        <Link href="/tpo/reports" className="mt-3 inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>
      </Alert>
      {visibleGroups.length === 0 ? <EmptyState title="No matching reports" description="Clear filters to see the full report directory." /> : null}
      {visibleGroups.map(group => <section key={group.heading} className="space-y-3 border-b border-border pb-4">
        <h2 className="text-lg font-semibold">{group.heading}</h2>
        <p className="text-sm text-body">{group.description}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {group.cards.map(card => <Link key={card.path} href={card.path} className="block border-b border-border py-3 hover:text-link focus-visible:outline-2">
            <h3 className="font-semibold text-link">{card.title}</h3>
            <p className="text-sm text-body">{card.description}</p>
          </Link>)}
        </div>
      </section>)}
    </div>;
  }
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="TPO · Insights"
        title="Reports"
        description={TPO_LEGACY_REPORT_GALLERY_DESCRIPTION}
        actions={
          <Link
            href={reportHref("/tpo/reports/placement-summary", workspace)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 sm:w-auto md:min-h-9 text-sm font-[650] text-white hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
          >
            Open management view
          </Link>
        }
      />

      <ReportFilters workspace={workspace} userId={context.user.id} path="/tpo/reports" />
      <form method="get" action="/tpo/reports"
        className="grid min-w-0 gap-3 border-b border-border pb-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] lg:items-end" aria-label="Filter reports">
        {workspace.selectedSeasonId?<Input type="hidden" name="seasonId" value={workspace.selectedSeasonId}/>:null}
        {workspace.selectedJobId?<Input type="hidden" name="jobId" value={workspace.selectedJobId}/>:null}
        <label className="grid min-w-0 flex-1 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Find a report
          <Input type="search" name="q" maxLength={80} defaultValue={parsedSearch.data}
            placeholder="Report name or purpose"
            className="min-h-11 md:min-h-9 w-full"/>
        </label>
        <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Report category
          <Select name="group" defaultValue={parsedGroup.data}
            className="min-h-11 md:min-h-9">
            {TPO_REPORT_GALLERY_GROUPS.map(group=><option key={group} value={group}>
              {group==="ALL"?"All report categories":group}
            </option>)}
          </Select>
        </label>
        <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">Search</Button>
        <Link href={reportHref("/tpo/reports",workspace)}
          className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline">
          Clear
        </Link>
      </form>
      <nav aria-label="Placement journey" className="space-y-3 border-y border-border py-4">
        <h2 className="text-lg font-semibold">Placement journey</h2>
        <p className="text-sm text-body">The college&apos;s placement journey: {workspace.report.metrics.offers} {workspace.report.metrics.offers === 1 ? "offer" : "offers"} made. Click any number for its report.</p>
        <div className="grid gap-0 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-border sm:grid-cols-3">
          {([
            {label:"Looking for a job",count:workspace.report.metrics.registered,href:"/tpo/reports/by-branch"},
            {label:"Placed",count:workspace.report.metrics.studentsPlaced,href:"/tpo/reports/placement-summary"},
            {label:"Accepted",count:workspace.report.metrics.studentsAccepted,href:"/tpo/reports/offers-acceptance"},
          ] as const).map(step => <Link key={step.label} href={reportHref(step.href,workspace)}
            className="block min-w-0 bg-surface p-4 hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px]">
            <span className="block text-sm text-body">{step.label}</span>
            <strong className="mt-1 block text-2xl tabular-nums text-link">{step.count.toLocaleString("en-IN")}</strong>
          </Link>)}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Placement journey gaps">
          <Link href={reportHref("/tpo/reports/unplaced",workspace)} className="font-semibold text-link underline">
            Unplaced · {Math.max(0,workspace.report.metrics.registered-workspace.report.metrics.studentsPlaced)}
          </Link>
          {workspace.report.metrics.studentsPlaced>=workspace.report.metrics.studentsAccepted?
            <Link href={reportHref("/tpo/reports/offers-acceptance",workspace)} className="font-semibold text-link underline">
              Not accepted yet · {workspace.report.metrics.studentsPlaced-workspace.report.metrics.studentsAccepted}
            </Link>:null}
        </div>
        <p className="text-xs text-muted-foreground">Each stage counts unique students; the number of offers made is shown separately. A stage gap is not a verified historical transition.</p>
      </nav>
      <ReportMetrics metrics={workspace.report.metrics} />

      {workspace.noSeason ? (
        <EmptyState
          title="No placement season available"
          description="Create a placement season before reviewing season-level outcomes. No placement performance is inferred without a season."
        />
      ) : null}


      <p role="status" className="text-sm text-body leading-[1.6]">{countVisibleTpoReportCards(visibleGroups)} matching reports in the selected scope.</p>
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
                  className="block border-b border-border py-4 transition hover:border-primary hover:bg-primary-subtle"
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
      <Disclosure title="Placement journey methodology" className="border-t border-border py-3">
        <ReportScopeNote note={workspace.registrationScopeNote} />
        <p className="mt-2 text-xs text-muted-foreground">A placed learner, an accepted learner, and an accepted offer are separate measures. No conversion rate is inferred from unlike populations.</p>
      </Disclosure>
    </div>
  );
}
