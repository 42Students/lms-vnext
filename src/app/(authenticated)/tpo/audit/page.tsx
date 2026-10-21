import { DateInput } from "@/components/ui/date-input";
import { StatTile } from "@/components/ui/stat-tile";
import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
import { Tabs } from "@/components/ui/tabs";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import { PageSizeSelect } from "@/components/ui/page-size-select";
import {Input} from "@/components/ui/input";
import {TpoAuditSavedViews} from "@/components/tpo/tpo-audit-saved-views";
import {tpoIndiaCalendarDay} from "@/modules/placements/tpo-local-date-model";
import {TpoAuditGrid} from "@/components/tpo/tpo-audit-grid";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Disclosure } from "@/components/ui/disclosure";
import { FilterChipLink } from "@/components/ui/filter-chip";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  TPO_AUDIT_KINDS,
  TPO_AUDIT_KIND_LABELS,
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

  await requireTpoBatchActor(context);
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
      <div className="min-w-0 max-w-full space-y-4">
        <PageHeader
          eyebrow="TPO · Oversight"
          title="Audit Log"
          description="College-scoped history of persisted placement activity."
        />
        <ErrorState
          title="Invalid audit filters"
          description="Check the selected category, date range, search text and page number. No audit data was loaded."
          action={
            <Link
              href="/tpo/audit"
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-[var(--lms-teal-deep)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
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
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader
        eyebrow="TPO · Oversight"
        title="Audit Log"
        description="A traceable history of placement decisions, changes, sharing and access across the workspace."
        actions={<div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Link href="/tpo/audit/actors" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Actor / entity filters and CSV →
          </Link>

        <Disclosure title="Exports" className="min-w-0 border-0" summaryClassName="border border-[var(--lms-canvas-border)] px-3" contentClassName="pt-2">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a href={"/api/placements/tpo/audit/export?"+new URLSearchParams({
            ...(query.kind!=="ALL"?{kind:query.kind}:{}),
            ...(query.from?{from:query.from}:{}),...(query.to?{to:query.to}:{}),
            ...(query.q?{q:query.q}:{}),...(query.who?{who:query.who}:{}),
           }).toString()}
           className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)] md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
           Export audit-log CSV
          </a>
          <a href={"/api/placements/tpo/audit/actors/export?"+new URLSearchParams({
           ...(query.from?{from:query.from}:{}),...(query.to?{to:query.to}:{}),
          }).toString()}
           className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)] md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
           Export actor audit CSV
          </a>
          </div>
        </Disclosure>
        </div>}
      />

      <section
        aria-label="Audit summary"
        className="grid min-w-0 grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4"
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
          <StatTile className={tpoTileStyles.tile} key={metric.label} label={metric.label} value={metric.count} />
        ))}
      </section>

      {summary.total>5000?<p role="status" className="border-l-2 border-warning bg-warning-subtle px-3 py-2 text-sm text-body">
        The audit export is limited to the first 5,000 matching events ({summary.total} match).
        Narrow the From and To dates above, then export each range to include all events.
      </p>:null}
      <p className="text-xs text-muted-foreground leading-5">About and What happened: use the category tabs. Who and When: use the actor/entity view and date filters. The actor view contains additional scoped audit filters.</p>
      <TpoAuditSavedViews
       filters={{kind:query.kind,from:query.from,to:query.to,q:query.q,who:query.who}}/>
      <nav aria-label="Quick looks" className="flex flex-wrap gap-2">
       <span className="self-center text-sm font-semibold">Quick looks</span>
       {quickLooks.map(look=><FilterChipLink key={look.label} href={quickHref(look.from,look.to)} selected={query.from===look.from&&query.to===look.to}>{look.label}</FilterChipLink>)}
      </nav>
      <Tabs ariaLabel="Filter audit by category" renderPanel={false} value={query.kind} items={[{kind:"ALL" as const,label:"All",count:query.kind==="ALL"?summary.total:null},...TPO_AUDIT_KINDS.map(kind=>({kind,label:TPO_AUDIT_KIND_LABELS[kind],count:query.kind==="ALL"?summary.byKind[kind]:null}))].map(item=>({value:item.kind,label:item.label,count:item.count??undefined,href:tpoAuditHref({...paginationFilters,kind:item.kind,page:1})}))}/>
      <section aria-labelledby="section-audit-filters" className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
        <h2 id="section-audit-filters" className="m-0 text-base font-semibold text-foreground">
          Audit filters
        </h2>

        <form role="search" aria-label="tpo audit filters"
          method="get"
          action="/tpo/audit"
          className="mt-3 grid min-w-0 grid-cols-1 gap-[8px] sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="contents">          <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            About
            <Select
              name="kind"
              defaultValue={query.kind}
              className="min-h-11 md:min-h-9"
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
            </Select>
          </label>

          <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            From (IST)
            <DateInput mode="date"
              name="from"
              defaultValue={query.from ?? ""}
              className="min-h-11 md:min-h-9"
            />
          </label>

          <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            To (IST)
            <DateInput mode="date"
              name="to"
              defaultValue={query.to ?? ""}
              className="min-h-11 md:min-h-9"
            />
          </label>

          <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Search
            <Input
              type="search"
              name="q"
              maxLength={120}
              defaultValue={query.q}
              placeholder="What happened, job or who"
              className="min-h-11 md:min-h-9"
            />
          </label>

          </div>
          <Disclosure title="Who · Rows per page" className="min-w-0 border-0 sm:col-span-2 lg:col-span-4" defaultOpen={Boolean(query.who || pageSize!==25)} contentClassName="pt-3">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Who
            <Input type="search" name="who" maxLength={100} defaultValue={query.who}
              placeholder="Actor name contains…" className="min-h-11 md:min-h-9"/>
          </label>
          <PageSizeSelect name="pageSize" defaultValue={String(pageSize)} options={[25,50,100]} />
            </div>
          </Disclosure>

          <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:col-span-2 lg:col-span-4">
            <Button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-6 sm:w-auto text-sm font-semibold text-on-primary hover:bg-primary-hover  md:min-h-9"
            >
              Apply filters
            </Button>
            <Link
              href="/tpo/audit"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body hover:text-[var(--lms-teal-deep)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
            >
              Clear filters
            </Link>
          </div>
        </form>
      </section>

      {result.unavailableSources.length > 0 ? (
        <section
          role="status"
          className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface-subtle p-4 text-sm leading-6 text-body"
        >
          Some sharing activity could not be loaded. The totals shown may be incomplete. Try again later.
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="m-0 text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">
              Event history
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-[22px]">
              {summary.total === 0
                ? "Nothing logged yet"
                : firstItem > summary.total
                  ? `Page ${page} is beyond the available records`
                  : `Showing ${firstItem}–${lastItem} of ${summary.total} records`}
            </p>
          </div>
          <p className="m-0 text-xs text-muted-foreground leading-5">
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
            action={<Link href={summary.total===0?"/tpo/audit":tpoAuditHref({...paginationFilters,page:1})}
              className="md:min-h-9 inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{summary.total===0?"Clear filters":"First page"}</Link>}
          />
        ) : (
          <TpoAuditGrid rows={items}/>
        )}

        {totalPages>1?<nav
          aria-label="Audit pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="m-0 text-sm text-muted-foreground leading-[22px]">
            Page {page} of {totalPages}
          </p>

          <div className="flex flex-wrap gap-2">
            {page > 1 ? (
              <Link
                href={tpoAuditHref({
                  ...paginationFilters,
                  page: page - 1,
                })}
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-[var(--lms-teal-deep)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
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
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-[var(--lms-teal-deep)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
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
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-[var(--lms-teal-deep)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>:null}
      </section>

      <p role="note" className="text-xs leading-5 text-muted-foreground">Audit totals count source records, not necessarily unique actions. Related records are retained so no recorded decision is silently discarded.</p>
      <p className="text-xs leading-5 text-muted-foreground">
        This history shows recorded placement decisions, changes, sharing and access. Sensitive personal details are hidden. Earlier changes may not appear if they were not recorded at the time.
      </p>
    </div>
  );
}
