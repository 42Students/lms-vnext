import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
import { TrackerIssueSavedViews } from "@/components/tracker/tracker-issue-saved-views";
import { TrackerIssuesFilterBar } from "@/components/tracker/tracker-issues-filter-bar";
import { TrackerIssueBulkActions } from "@/components/tracker/tracker-issue-bulk-actions";
import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { isSuperAdmin } from "@/modules/identity/context";
import { listBugTrackerIssuesForAdmin } from "@/modules/bug-tracker/admin-service";
import {
  BUG_ENVIRONMENTS,
  BUG_SEVERITIES,
} from "@/modules/bug-tracker/admin-validation";
import { BUG_STATUSES } from "@/modules/bug-tracker/workflow";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";
import { parseTrackerIssuesPageParams } from "@/modules/bug-tracker/issues-query-model";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export const metadata={title:"Issues · 42 Tracker"};
export default async function TrackerIssuesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context) || context.adminScope?.collegeId ||
      context.adminScope?.organizationId) redirect("/dashboard");

  const parsed = parseTrackerIssuesPageParams(await searchParams);

  if (!trackerAdminRuntimeEnabled()) {
    return (
      <div className="min-w-0 space-y-4">
        <PageHeader
          title="Issues"
          description="Migration 0076 registers the tracker tables. This environment has not enabled their verified runtime flag."
        />
        <TrackerAdminNav />
        <Banner tone="warning">
          <strong>Tracker database is not enabled.</strong>
          Apply and verify migration 0076, then explicitly set DB10_TRACKER_READY=DB10_VERIFIED before enabling these issue reads.
        </Banner>
      </div>
    );
  }

  if (!parsed) {
    return (
      <div className="min-w-0 space-y-4">
        <PageHeader title="Issues" description="Review and triage reported LMS issues." />
        <TrackerAdminNav />
        <ErrorState title="Invalid issue filter." description="Review and triage reported LMS issues."
          action={<Link className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link underline" href="/tracker/issues">
            Reset filters
          </Link>}/>
      </div>
    );
  }

  let page: Awaited<ReturnType<typeof listBugTrackerIssuesForAdmin>>;
  try {
    page = await listBugTrackerIssuesForAdmin(context, parsed.input);
  } catch {
    const retry = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) {
      if (typeof value === "string") retry.set(key, value);
    }
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Issues" description="Private Super Admin issue triage." />
      <TrackerAdminNav />
      <ErrorState title="Issues could not be loaded."
        description="Your filters have been preserved. Try loading the issues again."
        action={<Link href={"/tracker/issues" + (retry.toString() ? "?" + retry.toString() : "")}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>}/>
    </div>;
  }
  const current = parsed.display;
  const next = new URLSearchParams();
  if (current.status) next.set("status", current.status);
  if (current.severity) next.set("severity", current.severity);
  if (current.environment) next.set("environment", current.environment);
  if (current.q) next.set("q", current.q);
  if (current.reporter) next.set("reporter", current.reporter);
  next.set("sort", current.sort);
  if (page.nextCursor) {
    next.set("beforeCreatedAt", page.nextCursor.beforeCreatedAt.toISOString());
    next.set("beforeId", page.nextCursor.beforeId);
  }

  return (
    <div className="min-w-0 space-y-4">
      <PageHeader
        eyebrow="42 Tracker"
        title="Issues"
        description={"Showing " + page.items.length + (page.nextCursor ? "+" : "") + " " +
          (page.items.length === 1 && !page.nextCursor ? "issue" : "issues") +
          " in this view. Search what has already been reported before adding another."}
        actions={<Link href="/tracker"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--lms-button-primary-hover)] md:min-h-9">
          Report issue
        </Link>}
      />
      <TrackerAdminNav />
      <TrackerIssueSavedViews filters={new URLSearchParams({
        ...(current.q?{q:current.q}:{}),
        ...(current.reporter?{reporter:current.reporter}:{}),
        ...(current.status?{status:current.status}:{}),
        ...(current.severity?{severity:current.severity}:{}),
        ...(current.environment?{environment:current.environment}:{}),
        sort:current.sort,
      }).toString()} />

      <TrackerIssuesFilterBar
        initial={{q:current.q??"",status:current.status??"",environment:current.environment??"",
          reporter:current.reporter??"",severity:current.severity??"",sort:current.sort}}
        statuses={BUG_STATUSES} environments={BUG_ENVIRONMENTS} severities={BUG_SEVERITIES}
      />

      <p role="status" className="text-sm text-muted-foreground">
        Showing {page.items.length} {page.items.length===1?"issue":"issues"} on this page (20 per page). Filters remain applied when you load more.
      </p>

      {page.items.length === 0 ? (
        <EmptyState title="No matching issues." description="Review and triage reported LMS issues."
          action={<Link href="/tracker/issues" className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 font-semibold text-link">Reset</Link>}/>
      ) : (
        <div className="grid min-w-0 gap-3" role="list" aria-label="Reported issues">
          {page.items.map(issue=>(
            <article key={issue.id} role="listitem" className="min-w-0">
              <Link href={"/tracker/issues/"+encodeURIComponent(issue.publicId)}
                className="block min-w-0 rounded-[10px] border border-border bg-surface p-4 no-underline hover:border-[var(--lms-primary)] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <h2 className="m-0 break-words text-sm font-semibold text-link">
                    {issue.publicId} · {[issue.page,issue.screen,issue.section].filter(Boolean).join(" › ")||issue.issueType}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={issue.severity==="BLOCKER"||issue.severity==="CRITICAL"?"error":
                      issue.severity==="MAJOR"?"warning":"neutral"}>
                      {issue.severity.toLowerCase().replaceAll("_"," ").replace(/^./,c=>c.toUpperCase())}
                    </StatusBadge>
                    <StatusBadge tone={issue.status==="CLOSED"?"success":
                      issue.status==="NEW"||issue.status==="READY_FOR_RETEST"?"warning":"info"}>
                      {issue.status.toLowerCase().replaceAll("_"," ").replace(/^./,c=>c.toUpperCase())}
                    </StatusBadge>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-body [overflow-wrap:anywhere]">{issue.description}</p>
                <dl className="mt-3 grid min-w-0 gap-2 border-t border-border pt-3 text-xs text-muted-foreground sm:grid-cols-3">
                  <div><dt className="font-semibold">Reporter</dt><dd>{issue.reporterName}</dd></div>
                  <div><dt className="font-semibold">Environment</dt>
                    <dd>{issue.environment.toLowerCase().replace(/^./,c=>c.toUpperCase()).replaceAll("_"," ")}</dd></div>
                  <div><dt className="font-semibold">Reported</dt>
                    <dd>{issue.createdAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST</dd></div>
                </dl>
              </Link>
            </article>
          ))}
        </div>
      )}

      <TrackerIssueBulkActions rows={page.items.map(issue=>({
        publicId:issue.publicId,version:issue.version,status:issue.status
      }))} />
      {page.nextCursor ? (
        <div className="flex justify-center">
          <Link
            href={"/tracker/issues?" + next.toString()}
            className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
          >
            {current.sort === "newest" ? "Older issues" : "Newer issues"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
