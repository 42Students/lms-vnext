import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
import { TrackerIssueSavedViews } from "@/components/tracker/tracker-issue-saved-views";
import { TrackerIssueBulkActions } from "@/components/tracker/tracker-issue-bulk-actions";
import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
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
        title="Issues"
        description="Private Super Admin triage. Engineering notes and attachment metadata are never exposed through a public list."
        actions={<Link href="/tracker"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-4 text-sm font-semibold text-primary-text md:min-h-9">
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

      <form className="grid min-w-0 items-end gap-3 border-b border-[var(--lms-canvas-border)] pb-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Search
          <Input className="min-h-11 w-full md:min-h-9" name="q" defaultValue={current.q ?? ""} placeholder="Search ID, description or page" />
        </label>
        <div className="flex min-w-0 flex-wrap items-center gap-2 max-[767px]:[&>button]:flex-1">
          <Button type="submit" variant="primary" className="min-h-11 md:min-h-9">Apply filters</Button>
          <Link href="/tracker/issues" className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Reset
          </Link>
        </div>
        <details open={Boolean(current.reporter || current.status || current.severity || current.environment || current.sort!=="newest")}
          className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-2 md:col-span-2">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text md:min-h-9">More filters</summary>
          <div className="mt-2 grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Reporter
          <Input className="min-h-11 w-full md:min-h-9" name="reporter" defaultValue={current.reporter??""} maxLength={100} placeholder="Reporter name"/>
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Status
          <Select className="min-h-11 w-full md:min-h-9" name="status" defaultValue={current.status ?? ""}>
            <option value="">All statuses</option>
            {BUG_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}
          </Select>
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Severity
          <Select className="min-h-11 w-full md:min-h-9" name="severity" defaultValue={current.severity ?? ""}>
            <option value="">All severities</option>
            {BUG_SEVERITIES.map((x) => <option key={x} value={x}>{x}</option>)}
          </Select>
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Environment
          <Select className="min-h-11 w-full md:min-h-9" name="environment" defaultValue={current.environment ?? ""}>
            <option value="">All environments</option>
            {BUG_ENVIRONMENTS.map((x) => <option key={x} value={x}>{x}</option>)}
          </Select>
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Sort
          <Select className="min-h-11 w-full md:min-h-9" name="sort" defaultValue={current.sort}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </Select>
        </label>
          </div>
        </details>
      </form>

      <p role="status" className="text-sm text-muted-foreground">
        Showing {page.items.length} issues on this page (up to 20 per page). Filters remain applied when you load more.
      </p>
      <TrackerIssueBulkActions rows={page.items.map(issue=>({publicId:issue.publicId,version:issue.version,status:issue.status}))} />

      {page.items.length === 0 ? (
        <EmptyState title="No matching issues." description="Review and triage reported LMS issues."
          action={<Link href="/tracker/issues" className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 font-semibold text-link">Reset</Link>}/>
      ) : (
        <div className="divide-y divide-[var(--lms-canvas-border)]">
          {page.items.map((issue) => (
            <article key={issue.id} className="min-w-0 py-4">
              <div className="flex min-w-0 flex-col gap-2">
                <div className="min-w-0">

                  <h2 className="m-0 text-[16px] font-semibold leading-[26px] text-foreground min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">
                    <Link className="inline-flex min-h-11 md:min-h-9 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={`/tracker/issues/${encodeURIComponent(issue.publicId)}`}>
                      {issue.publicId} · {issue.issueType}
                    </Link>
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={issue.status==="CLOSED"?"success":issue.status==="NEW"||issue.status==="READY_FOR_RETEST"?"warning":"info"}>{issue.status.toLowerCase().replaceAll("_"," ").replace(/^./,value=>value.toUpperCase())}</StatusBadge>
                    <StatusBadge tone={issue.severity==="BLOCKER"||issue.severity==="CRITICAL"?"error":issue.severity==="MAJOR"?"warning":"neutral"}>{issue.severity.toLowerCase().replaceAll("_"," ").replace(/^./,value=>value.toUpperCase())}</StatusBadge>
                    <StatusBadge>{issue.environment}</StatusBadge>
                  </div>
                  <p className="mt-1 line-clamp-2 max-w-3xl break-words [overflow-wrap:anywhere] text-sm leading-6 text-body">{issue.description}</p>
                  <p className="mt-2 max-w-3xl break-words [overflow-wrap:anywhere] text-xs text-muted-foreground">
                    {issue.reporterName} · {issue.accountRole} · {[issue.page,issue.screen,issue.section].filter(Boolean).join(" › ")} · {issue.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </p>
                </div>

              </div>
            </article>
          ))}
        </div>
      )}

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
