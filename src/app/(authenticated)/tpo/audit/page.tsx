import {TpoAuditSavedViews} from "@/components/tpo/tpo-audit-saved-views";
import {tpoIndiaCalendarDay} from "@/modules/placements/tpo-local-date-model";
import {TpoAuditGrid} from "@/components/tpo/tpo-audit-grid";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  TPO_AUDIT_KINDS,
  TPO_AUDIT_KIND_LABELS,
  formatTpoAuditEventType,
  tpoAuditHref,
} from "@/modules/placements/tpo-audit-model";
import {
  getTpoAuditLog,
  tpoAuditQuerySchema,
} from "@/modules/placements/tpo-audit-service";


/** Wall-clock read kept out of render bodies (React purity rule). */
function currentTimeMs(){return Date.now();}

type SearchParams = {
  kind?: string | string[];
  from?: string | string[];
  to?: string | string[];
  q?: string | string[];
  who?:string|string[];
  page?: string | string[];
  pageSize?: string | string[];
};

function first(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function auditDateTime(
  value: string,
) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export default async function TpoAuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context =
    await getCurrentRequestContext();

  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const parsed =
    tpoAuditQuerySchema.safeParse({
      kind: first(params.kind) || undefined,
      from: first(params.from) || undefined,
      to: first(params.to) || undefined,
      q: first(params.q) || undefined,
      who:first(params.who)||undefined,
      page: first(params.page) || undefined,
      pageSize:
        first(params.pageSize) || undefined,
    });

  if (!parsed.success) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="TPO · Oversight"
          title="Audit log"
          description="College-scoped history of persisted placement activity."
        />
        <ErrorState
          title="Invalid audit filters"
          description="Check the selected category, date range, search text and page number. No audit data was loaded."
          action={
            <Link
              href="/tpo/audit"
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
            >
              Clear filters
            </Link>
          }
        />
      </div>
    );
  }

  const result = await getTpoAuditLog(
    context,
    parsed.data,
  );

  const {
    query,
    summary,
    items,
    page,
    pageSize,
    totalPages,
  } = result;

  const firstItem =
    summary.total === 0
      ? 0
      : (page - 1) * pageSize + 1;

  const lastItem = Math.min(
    summary.total,
    page * pageSize,
  );

  const paginationFilters = {
    kind: query.kind,
    from: query.from,
    to: query.to,
    q: query.q,
    who:query.who,
    pageSize,
  };

  const toIstDate=tpoIndiaCalendarDay;
  const today=toIstDate(new Date());
  const quickLooks=[{label:"Today",from:today,to:today},
   {label:"7 days",from:toIstDate(new Date(currentTimeMs()-6*86400000)),to:today},
   {label:"30 days",from:toIstDate(new Date(currentTimeMs()-29*86400000)),to:today},
   {label:"Older",from:"",to:toIstDate(new Date(currentTimeMs()-30*86400000))},
  ];
  const quickHref=(from:string,to:string)=>{
   const params=new URLSearchParams({
    ...(query.kind!=="ALL"?{kind:query.kind}:{}),...(query.q?{q:query.q}:{}),...(query.who?{who:query.who}:{}),
    ...(from?{from}:{}),...(to?{to}:{}),
   });
   return "/tpo/audit?"+params.toString();
  };
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Oversight"
        title="Audit log"
        description="A traceable history of placement decisions, changes, sharing and access across the workspace."
        actions={<div className="flex flex-wrap gap-2">
          <a href={"/api/placements/tpo/audit/export?"+new URLSearchParams({
            ...(query.kind!=="ALL"?{kind:query.kind}:{}),
            ...(query.from?{from:query.from}:{}),...(query.to?{to:query.to}:{}),
            ...(query.q?{q:query.q}:{}),...(query.who?{who:query.who}:{}),
           }).toString()}
           className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
           Export audit-log CSV
          </a>
          <a href={"/api/placements/tpo/audit/actors/export?"+new URLSearchParams({
           ...(query.from?{from:query.from}:{}),...(query.to?{to:query.to}:{}),
          }).toString()}
           className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
           Export audit log CSV
          </a>
          <Link href="/tpo/audit/actors" className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
            Actor / entity filters and CSV →
          </Link>
        </div>}
      />

      <section
        aria-label="Audit summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            label: "Logged events",
            count: summary.total,
          },
          {
            label: "Decisions and changes",
            count: summary.decisionsAndChanges,
          },
          {
            label: "Share activity",
            count: summary.shares,
          },
          {
            label: "Other placement activity",
            count: summary.canonicalEvents,
          },
        ].map((metric) => (
          <article
            key={metric.label}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="m-0 text-xs font-semibold text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
              {metric.count}
            </p>
          </article>
        ))}
      </section>

      <TpoAuditSavedViews collegeId={context.membership.collegeId} userId={context.user.id}
       filters={{kind:query.kind,from:query.from,to:query.to,q:query.q,who:query.who}}/>
      <nav aria-label="Quick looks" className="flex flex-wrap gap-2">
       <span className="self-center text-sm font-semibold">Quick looks</span>
       {quickLooks.map(look=><Link key={look.label} href={quickHref(look.from,look.to)}
        aria-current={query.from===look.from&&query.to===look.to?"page":undefined}
        className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
        {look.label}
       </Link>)}
      </nav>
      <nav aria-label="Filter audit by category" className="flex flex-wrap gap-2">
        {[{kind:"ALL" as const,label:"All",count:query.kind==="ALL"?summary.total:null},
          ...TPO_AUDIT_KINDS.map(kind=>({kind,label:TPO_AUDIT_KIND_LABELS[kind],count:query.kind==="ALL"?summary.byKind[kind]:null}))]
         .map(item=><Link key={item.kind}
          href={tpoAuditHref({...paginationFilters,kind:item.kind,page:1})}
          aria-current={query.kind===item.kind?"page":undefined}
          className={query.kind===item.kind
           ?"inline-flex min-h-10 items-center rounded-full bg-primary px-3 text-xs font-semibold text-on-primary"
           :"inline-flex min-h-10 items-center rounded-full border border-border px-3 text-xs font-semibold text-primary-text"}>
          {item.label}{item.count===null?"":` (${item.count})`}
         </Link>)}
      </nav>
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Audit filters
        </h2>

        <form
          method="get"
          action="/tpo/audit"
          className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
        >
          <label className="grid gap-1 text-sm font-semibold text-body">
            About
            <select
              name="kind"
              defaultValue={query.kind}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
            >
              <option value="ALL">
                All events
              </option>
              {TPO_AUDIT_KINDS.map((kind) => (
                <option
                  key={kind}
                  value={kind}
                >
                  {TPO_AUDIT_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-semibold text-body">
            From (IST)
            <input
              type="date"
              name="from"
              defaultValue={query.from ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-body">
            To (IST)
            <input
              type="date"
              name="to"
              defaultValue={query.to ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-body">
            Search
            <input
              type="search"
              name="q"
              maxLength={120}
              defaultValue={query.q}
              placeholder="What happened, job or who"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-body">Who
            <input type="search" name="who" maxLength={100} defaultValue={query.who}
              placeholder="Actor name contains…" className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"/>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Rows per page
            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 xl:col-span-5">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
            >
              Apply filters
            </button>
            <Link
              href="/tpo/audit"
              className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
            >
              Clear filters
            </Link>
          </div>
        </form>
      </section>

      {result.unavailableSources.length > 0 ? (
        <section
          role="status"
          className="rounded-xl border border-border bg-surface-subtle p-4 text-sm leading-6 text-body"
        >
          Some sharing activity could not be loaded. The totals shown may be incomplete. Try again later.
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-semibold text-foreground">
              Event history
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary.total === 0
                ? "Nothing logged yet"
                : firstItem > summary.total
                  ? `Page ${page} is beyond the available records`
                  : `Showing ${firstItem}–${lastItem} of ${summary.total} records`}
            </p>
          </div>
          <p className="m-0 text-xs text-muted-foreground">
            Most recent first · IST
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title={
              summary.total === 0
                ? "Nothing logged yet"
                : "No records on this page"
            }
            description={
              summary.total === 0
                ? "Every drive, decision and setting change your team makes shows up here."
                : "This page number is outside the available result range. Return to the first page or adjust the filters."
            }
          />
        ) : (
          <TpoAuditGrid rows={items}/>
        )}

        <nav
          aria-label="Audit pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="m-0 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>

          <div className="flex flex-wrap gap-2">
            {page > 1 ? (
              <Link
                href={tpoAuditHref({
                  ...paginationFilters,
                  page: page - 1,
                })}
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                ← Previous
              </Link>
            ) : null}

            {page > 1 ? (
              <Link
                href={tpoAuditHref({
                  ...paginationFilters,
                  page: 1,
                })}
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                First page
              </Link>
            ) : null}

            {page < totalPages ? (
              <Link
                href={tpoAuditHref({
                  ...paginationFilters,
                  page: page + 1,
                })}
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        This history shows recorded placement decisions, changes, sharing and access. Sensitive personal details are hidden. Earlier changes may not appear if they were not recorded at the time.
      </p>
    </div>
  );
}
