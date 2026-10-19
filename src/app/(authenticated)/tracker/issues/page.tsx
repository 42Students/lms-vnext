import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
import { TrackerIssueSavedViews } from "@/components/tracker/tracker-issue-saved-views";
import { TrackerIssueBulkActions } from "@/components/tracker/tracker-issue-bulk-actions";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Card } from "@/components/ui/card";
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
      <div className="space-y-6">
        <PageHeader
          eyebrow="42 Tracker"
          title="Issues"
          description="Migration 0076 registers the tracker tables. This environment has not enabled their verified runtime flag."
        />
        <TrackerAdminNav />
        <div role="status" className="border-y border-border py-6">
          <p className="m-0 font-semibold text-foreground">Tracker database is not enabled.</p>
          <p className="mt-2 text-sm text-body">
            Apply and verify migration 0076, then explicitly set DB10_TRACKER_READY=DB10_VERIFIED before enabling these issue reads.
          </p>
        </div>
      </div>
    );
  }

  if (!parsed) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="42 Tracker" title="Issues" description="Review and triage reported LMS issues." />
        <TrackerAdminNav />
        <ErrorState title="Invalid issue filter." description="Review and triage reported LMS issues."
          action={<Link className="inline-flex min-h-9 items-center font-semibold text-primary-text underline" href="/tracker/issues">
            Reset filters
          </Link>}/>
      </div>
    );
  }

  const page = await listBugTrackerIssuesForAdmin(context, parsed.input);
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="42 Tracker"
        title="Issues"
        description="Private Super Admin triage. Engineering notes and attachment metadata are never exposed through a public list."
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

      <form className="grid gap-3 border-b border-border pb-5 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-semibold text-body">
          Search
          <Input name="q" defaultValue={current.q ?? ""} placeholder="Search ID, description or page" />
        </label>
        <label className="text-xs font-semibold text-body">
          Reporter
          <Input name="reporter" defaultValue={current.reporter??""} maxLength={100} placeholder="Reporter name"/>
        </label>
        <label className="text-xs font-semibold text-body">
          Status
          <Select name="status" defaultValue={current.status ?? ""}>
            <option value="">All statuses</option>
            {BUG_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}
          </Select>
        </label>
        <label className="text-xs font-semibold text-body">
          Severity
          <Select name="severity" defaultValue={current.severity ?? ""}>
            <option value="">All severities</option>
            {BUG_SEVERITIES.map((x) => <option key={x} value={x}>{x}</option>)}
          </Select>
        </label>
        <label className="text-xs font-semibold text-body">
          Environment
          <Select name="environment" defaultValue={current.environment ?? ""}>
            <option value="">All environments</option>
            {BUG_ENVIRONMENTS.map((x) => <option key={x} value={x}>{x}</option>)}
          </Select>
        </label>
        <label className="text-xs font-semibold text-body">
          Sort
          <Select name="sort" defaultValue={current.sort}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </Select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-5">
          <Button type="submit" variant="primary">Apply filters</Button>
          <Link href="/tracker/issues" className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
            Reset
          </Link>
        </div>
      </form>

      <TrackerIssueBulkActions rows={page.items.map(issue=>({publicId:issue.publicId,version:issue.version,status:issue.status}))} />

      {page.items.length === 0 ? (
        <EmptyState title="No matching issues." description="Review and triage reported LMS issues."
          action={<Link href="/tracker/issues" className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 font-semibold text-primary-text">Reset</Link>}/>
      ) : (
        <div className="grid gap-3">
          {page.items.map((issue) => (
            <Card as="article" key={issue.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge>{issue.status.toLowerCase().replaceAll("_"," ").replace(/^./,value=>value.toUpperCase())}</StatusBadge>
                    <StatusBadge>{issue.severity.toLowerCase().replaceAll("_"," ").replace(/^./,value=>value.toUpperCase())}</StatusBadge>
                    <StatusBadge>{issue.environment}</StatusBadge>
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-foreground">
                    <Link className="inline-flex min-h-9 items-center text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]" href={`/tracker/issues/${encodeURIComponent(issue.publicId)}`}>
                      {issue.publicId} · {issue.issueType}
                    </Link>
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-body">{issue.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {issue.reporterName} · {issue.accountRole} · {[issue.page,issue.screen,issue.section].filter(Boolean).join(" › ")} · {issue.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </p>
                </div>
                <Link
                  href={`/tracker/issues/${encodeURIComponent(issue.publicId)}`}
                  className="inline-flex min-h-9 shrink-0 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-foreground hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
                >
                  Open issue
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {page.nextCursor ? (
        <div className="flex justify-center">
          <Link
            href={"/tracker/issues?" + next.toString()}
            className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
          >
            {current.sort === "newest" ? "Older issues" : "Newer issues"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
