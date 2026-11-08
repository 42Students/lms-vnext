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
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatDateTimeIst } from "@/lib/format-date";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export const metadata={title:"Issues · 42 Tracker"};
export default async function TrackerIssuesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const context = await getCurrentRequestContext();
  if (context.user.platformStatus !== "ACTIVE") redirect("/dashboard");
  if (!isSuperAdmin(context) || context.adminScope?.collegeId ||
      context.adminScope?.organizationId) redirect("/dashboard");

  const parsed = parseTrackerIssuesPageParams(await searchParams);

  if (!trackerAdminRuntimeEnabled()) {
    return (
      <div className="min-w-0 space-y-4">
        <PageHeader
          title="Issues"
          description="Issue triage is temporarily unavailable while the tracker database setup is being verified."
        />
        <TrackerAdminNav />
        <div className="flex min-h-11 items-center"><TextLink href="/tracker/issues/public" className="text-sm">View public issue summaries</TextLink></div>
        <Banner tone="warning">
          <strong>Issue triage is unavailable right now.</strong>
          Setup needs administrator verification before reported issues can be reviewed. No issue records were loaded.
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
          action={<TextLink className="inline-flex min-h-11 md:min-h-9 items-center" href="/tracker/issues">
            Reset filters
          </TextLink>}/>
      </div>
    );
  }

  let page: Awaited<ReturnType<typeof listBugTrackerIssuesForAdmin>>;
  try {
    if (parsed.legacyPage && parsed.legacyPage > 1) {
      // Legacy links use one-based page numbers. Walk the scoped cursor chain
      // rather than fetching an arbitrary offset that bypasses filter ordering.
      let cursor: {beforeCreatedAt: string; beforeId: string} | null = null;
      let latest: Awaited<ReturnType<typeof listBugTrackerIssuesForAdmin>> | null = null;
      for (let index = 1; index <= parsed.legacyPage; index++) {
        latest = await listBugTrackerIssuesForAdmin(context, {
          ...parsed.input,
          ...(cursor ?? {}),
        });
        if (index < parsed.legacyPage) {
          if (!latest.nextCursor) {
            latest = {...latest, items: [], nextCursor: null};
            break;
          }
          cursor = {
            beforeCreatedAt:latest.nextCursor.beforeCreatedAt.toISOString(),
            beforeId:latest.nextCursor.beforeId,
          };
        }
      }
      page = latest!;
    } else {
      page = await listBugTrackerIssuesForAdmin(context, parsed.input);
    }
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
        action={<TextLink href={"/tracker/issues" + (retry.toString() ? "?" + retry.toString() : "")}
          className="inline-flex min-h-11 items-center md:min-h-9">Retry</TextLink>}/>
    </div>;
  }
  const current = parsed.display;
  const hasFilters=Boolean(current.status||current.severity||current.environment||current.q||current.reporter||current.sort!=="newest");
  const next = new URLSearchParams();
  if (current.status) next.set("status", current.status);
  if (current.severity) next.set("severity", current.severity);
  if (current.environment) next.set("environment", current.environment);
  if (current.q) next.set("q", current.q);
  if (current.reporter) next.set("reporter", current.reporter);
  next.set("sort", current.sort);
  if (page.nextCursor) {
    if (parsed.legacyPage && parsed.legacyPage < 20) {
      next.set("page", String(parsed.legacyPage + 1));
    } else {
      next.set("beforeCreatedAt", page.nextCursor.beforeCreatedAt.toISOString());
      next.set("beforeId", page.nextCursor.beforeId);
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      <PageHeader
        eyebrow="42 Tracker"
        title="Issues"
        description={"Showing " + page.items.length + (page.nextCursor ? "+" : "") + " " +
          (page.items.length === 1 && !page.nextCursor ? "issue" : "issues") +
          " in this view. Search what has already been reported before adding another."}
        actions={<ButtonLink variant="primary" href="/tracker">
          Report issue
        </ButtonLink>}
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
        <EmptyState title={hasFilters?"No issues match these filters":"No reported issues yet"}
          description={hasFilters?"Try a different search or clear filters to review all reported issues.":"There are no submitted issues to triage in this view. You can still report a new LMS issue."}
          action={<ButtonLink variant="secondary" href={hasFilters?"/tracker/issues":"/tracker"}>{hasFilters?"Clear filters":"Report issue"}</ButtonLink>}/>
      ) : (
        <div className="grid min-w-0 gap-3" role="list" aria-label="Reported issues">
          {page.items.map(issue=>(
            <article key={issue.id} role="listitem" className="min-w-0">
              <TextLink href={"/tracker/issues/"+encodeURIComponent(issue.publicId)}
                className="block min-w-0 rounded-[10px] border border-border bg-surface p-4">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <Heading level={2} size="sm" className="m-0 break-words text-link">
                    {issue.publicId} · {[issue.page,issue.screen,issue.section].filter(Boolean).join(" › ")||issue.issueType}
                  </Heading>
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
                    <dd>{formatDateTimeIst(issue.createdAt)} IST</dd></div>
                </dl>
              </TextLink>
            </article>
          ))}
        </div>
      )}

      <TrackerIssueBulkActions rows={page.items.map(issue=>({
        publicId:issue.publicId,version:issue.version,status:issue.status
      }))} />
      {page.nextCursor ? (
        <div className="flex justify-center">
          <ButtonLink variant="secondary"
            href={"/tracker/issues?" + next.toString()}
          >
            {current.sort === "newest" ? "Older issues" : "Newer issues"}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
