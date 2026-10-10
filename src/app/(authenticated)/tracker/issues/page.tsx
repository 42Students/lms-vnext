import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { isSuperAdmin } from "@/modules/identity/context";
import { listBugTrackerIssuesForAdmin } from "@/modules/bug-tracker/admin-service";
import {
  BUG_ENVIRONMENTS,
  BUG_SEVERITIES,
  trackerAdminListSchema,
} from "@/modules/bug-tracker/admin-validation";
import { BUG_STATUSES } from "@/modules/bug-tracker/workflow";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function TrackerIssuesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) redirect("/dashboard");

  const params = await searchParams;
  const raw = {
    status: one(params.status),
    severity: one(params.severity),
    environment: one(params.environment),
    q: one(params.q),
    sort: one(params.sort),
    beforeCreatedAt: one(params.beforeCreatedAt),
    beforeId: one(params.beforeId),
    limit: 50,
  };
  const parsed = trackerAdminListSchema.safeParse(raw);

  if (!trackerAdminRuntimeEnabled()) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="42 Tracker"
          title="Issues"
          description="Tracker code is staged but the DB10 migration has not been promoted and verified."
        />
        <TrackerAdminNav />
        <div role="status" className="rounded-xl border border-border bg-surface p-6">
          <p className="m-0 font-semibold text-foreground">Tracker database is not enabled.</p>
          <p className="mt-2 text-sm text-body">
            W01 must register and replay the DB10 tracker tables before this page can read issue data.
          </p>
        </div>
      </div>
    );
  }

  if (!parsed.success) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="42 Tracker" title="Issues" description="Review and triage reported LMS issues." />
        <TrackerAdminNav />
        <div role="alert" className="rounded-xl border border-border bg-surface p-5">
          <p className="m-0 font-semibold text-foreground">Invalid issue filter.</p>
          <Link className="mt-2 inline-block font-semibold text-primary-text underline" href="/tracker/issues">
            Reset filters
          </Link>
        </div>
      </div>
    );
  }

  const page = await listBugTrackerIssuesForAdmin(context, parsed.data);
  const current = parsed.data;
  const next = new URLSearchParams();
  if (current.status) next.set("status", current.status);
  if (current.severity) next.set("severity", current.severity);
  if (current.environment) next.set("environment", current.environment);
  if (current.q) next.set("q", current.q);
  next.set("sort", current.sort);
  if (page.nextCursor) {
    next.set("beforeCreatedAt", page.nextCursor.beforeCreatedAt.toISOString());
    next.set("beforeId", page.nextCursor.beforeId);
  }

  const inputClass =
    "min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="42 Tracker"
        title="Issues"
        description="Private Super Admin triage. Engineering notes and attachment metadata are never exposed through a public list."
      />
      <TrackerAdminNav />

      <form className="grid gap-3 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-semibold text-body">
          Search
          <input className={inputClass} name="q" defaultValue={current.q ?? ""} placeholder="ID, reporter, page, description" />
        </label>
        <label className="text-xs font-semibold text-body">
          Status
          <select className={inputClass} name="status" defaultValue={current.status ?? ""}>
            <option value="">All statuses</option>
            {BUG_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-body">
          Severity
          <select className={inputClass} name="severity" defaultValue={current.severity ?? ""}>
            <option value="">All severities</option>
            {BUG_SEVERITIES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-body">
          Environment
          <select className={inputClass} name="environment" defaultValue={current.environment ?? ""}>
            <option value="">All environments</option>
            {BUG_ENVIRONMENTS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-body">
          Sort
          <select className={inputClass} name="sort" defaultValue={current.sort}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-5">
          <button type="submit" className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Apply filters
          </button>
          <Link href="/tracker/issues" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-foreground">
            Reset
          </Link>
        </div>
      </form>

      {page.items.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="m-0 font-semibold text-foreground">No issues match these filters.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {page.items.map((issue) => (
            <article key={issue.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge>{issue.status}</StatusBadge>
                    <StatusBadge>{issue.severity}</StatusBadge>
                    <StatusBadge>{issue.environment}</StatusBadge>
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-foreground">
                    <Link className="hover:text-primary-text" href={`/tracker/issues/${encodeURIComponent(issue.publicId)}`}>
                      {issue.publicId} · {issue.issueType}
                    </Link>
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-body">{issue.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {issue.reporterName} · {issue.accountRole} · {issue.page} · {issue.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </p>
                </div>
                <Link
                  href={`/tracker/issues/${encodeURIComponent(issue.publicId)}`}
                  className="inline-flex min-h-10 shrink-0 items-center rounded-md border border-border px-4 text-sm font-semibold text-foreground hover:border-primary"
                >
                  Open issue
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {page.nextCursor ? (
        <div className="flex justify-center">
          <Link
            href={"/tracker/issues?" + next.toString()}
            className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle"
          >
            {current.sort === "newest" ? "Older issues" : "Newer issues"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
