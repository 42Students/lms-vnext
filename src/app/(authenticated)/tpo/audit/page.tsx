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
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import {reportPageReadFailure} from "@/observability/page-read-failure";
import { TpoAuditStaleSnapshot, TpoAuditRefreshAction } from "@/components/tpo/tpo-audit-stale-snapshot";
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
  TPO_AUDIT_ABOUT_CATEGORIES,
  tpoAuditAboutCategory,
  tpoAuditHref,
} from "@/modules/placements/tpo-audit-model";
import {
  getTpoAuditLog,
  tpoAuditQuerySchema,
} from "@/modules/placements/tpo-audit-service";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { istDateTimeFormatter } from "@/lib/format-date";


import { ROLE } from "@/modules/identity/roles";
import { first } from "@/lib/shared";
type SearchParams = {
  kind?: string | string[];
  f_about?:string|string[];
  from?: string | string[];
  to?: string | string[];
  q?: string | string[];
  who?:string|string[];
  page?: string | string[];
  pageSize?: string | string[];
};

function auditDateTime(
  value: string,
) {
  return istDateTimeFormatter.format(new Date(value));
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
    !hasMembershipRole(context, ROLE.TPO)
  ) {
    redirect("/dashboard");
  }

  await requireTpoBatchActor(context);
  const params = await searchParams;
  // Next searchParams preserves repeated query values as arrays. Never pick
  // the first value or silently ignore a foreign filter before reading audit data.
  const allowedKeys = new Set([
    "kind", "f_about", "from", "to", "q", "who", "page", "pageSize",
  ]);
  const invalidFilterKeys = Object.keys(params).some(key => !allowedKeys.has(key)) ||
    Object.values(params).some(Array.isArray);

  const parsed =
    tpoAuditQuerySchema.safeParse({
      kind: first(params.kind) || undefined,
      f_about:first(params.f_about)||undefined,
      from: first(params.from) || undefined,
      to: first(params.to) || undefined,
      q: first(params.q) || undefined,
      who:first(params.who)||undefined,
      page: first(params.page) || undefined,
      pageSize:
        first(params.pageSize) || undefined,
    });

  if (invalidFilterKeys || !parsed.success) {
    return (
      <div className="min-w-0 max-w-full space-y-4">
        <PageHeader
          title="Audit log"
          description="College-scoped history of persisted placement activity."
        />
        <ErrorState
          title="Invalid audit filters"
          description="Check the selected category, date range, search text and page number. No audit data was loaded."
          action={
            <ButtonLink variant="secondary"
              href="/tpo/audit"
            >
              Clear filters
            </ButtonLink>
          }
        />
      </div>
    );
  }

  // A client-only, membership-and-filter-scoped snapshot survives a failed
  // server refresh. Changing college, role or query remounts it.
  const snapshotKey = context.membership.id + ":" + JSON.stringify(parsed.data);
  let result: Awaited<ReturnType<typeof getTpoAuditLog>>;
  try {
    result = await getTpoAuditLog(context, parsed.data);
  } catch (error) {
    // Revoked access must invalidate the visible page, never reuse old rows.
    reportPageReadFailure({event:"tpo.audit_read_failed",
      route:"/tpo/audit",stage:"audit_history"},error);
    return (
      <TpoAuditStaleSnapshot key={snapshotKey} failed>
        <div className="min-w-0 space-y-4">
          <PageHeader title="Audit log" description="A traceable history of placement decisions, changes, sharing and access across the workspace." />
          <ErrorState
            title="Could not refresh the audit log"
            description="The latest audit rows could not be verified. Retry to check the college-scoped source; do not treat this as an empty history."
            action={<TpoAuditRefreshAction />}
          />
        </div>
      </TpoAuditStaleSnapshot>
    );
  }

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
    ...(query.from===undefined?{}:{from:query.from}),
    ...(query.to===undefined?{}:{to:query.to}),
    q: query.q,
    who:query.who,
    pageSize,
  };

  const toIstDate=tpoIndiaCalendarDay;
  const today=toIstDate(new Date());
  const istCalendarOffset=(days:number)=>{
   const [year,month,day]=today.split("-").map(Number);
   return toIstDate(new Date(Date.UTC(year!,month!-1,day!-days,12)));
  };
  const quickLooks=[{label:"Today",from:today,to:today},
   {label:"Last 7 days",from:istCalendarOffset(6),to:today},
   {label:"Last 30 days",from:istCalendarOffset(29),to:today},
   {label:"Older",from:"",to:istCalendarOffset(30)},
  ];
  const entityMix=Object.entries(items.reduce<Record<string,number>>((counts,row)=>{
    const key=tpoAuditAboutCategory(row.eventType,row.entityType);
    counts[key]=(counts[key]??0)+1;
    return counts;
  },{})).sort((a,b)=>b[1]-a[1]).slice(0,7);
  const recentActors=new Set(items.map(item=>item.actorName||"System")).size;
  const recentLatest=items[0]?.occurredAt;
  const entityHref=(entity:string|null)=>{
    const params=new URLSearchParams();
    if(query.kind!=="ALL")params.set("kind",query.kind);
    if(query.from)params.set("from",query.from);
    if(query.to)params.set("to",query.to);
    if(query.q)params.set("q",query.q);
    if(query.who)params.set("who",query.who);
    if(entity)params.set("f_about",entity);
    return "/tpo/audit"+(params.size?"?"+params.toString():"");
  };
  const quickHref=(from:string,to:string)=>{
   const params=new URLSearchParams({
    ...(query.kind!=="ALL"?{kind:query.kind}:{}),...(query.q?{q:query.q}:{}),...(query.who?{who:query.who}:{}),
    ...(from?{from}:{}),...(to?{to}:{}),
   });
   return "/tpo/audit?"+params.toString();
  };
  const gridRefreshQuery=new URLSearchParams({
    kind:query.kind,page:String(query.page),pageSize:String(query.pageSize),
    ...(query.from?{from:query.from}:{}),
    ...(query.to?{to:query.to}:{}),
    ...(query.q?{q:query.q}:{}),
    ...(query.who?{who:query.who}:{})
  });
  for(const key of ["f_about","f_event","f_who","f_when"] as const)
   for(const item of query[key])gridRefreshQuery.append(key,item);
  const gridRefreshHref="/api/placements/tpo/audit?"+gridRefreshQuery.toString();
  return (
    <TpoAuditStaleSnapshot key={snapshotKey} failed={false}>
    <div data-testid="tpo.audit" className="min-w-0 max-w-full space-y-4">
      <PageHeader
        title="Audit log"
        description="A traceable history of placement decisions, changes, sharing and access across the workspace."
        actions={<div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <ButtonLink variant="primary" href="/tpo/audit/actors" className="w-full sm:w-auto">
            Actor / entity filters and CSV →
          </ButtonLink>

        <Disclosure title="Exports" className="min-w-0 border-0" summaryClassName="border border-[var(--lms-canvas-border)] px-3" contentClassName="pt-2">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <ButtonLink variant="secondary" href={"/api/placements/tpo/audit/export?"+new URLSearchParams({
            ...(query.kind!=="ALL"?{kind:query.kind}:{}),
            ...(query.from?{from:query.from}:{}),...(query.to?{to:query.to}:{}),
            ...(query.q?{q:query.q}:{}),...(query.who?{who:query.who}:{}),
           }).toString()}
           className="w-full sm:w-auto">
           Export audit-log CSV
          </ButtonLink>
          <ButtonLink variant="secondary" href={"/api/placements/tpo/audit/actors/export?"+new URLSearchParams({
           ...(query.from?{from:query.from}:{}),...(query.to?{to:query.to}:{}),
          }).toString()}
           className="w-full sm:w-auto">
           Export actor audit CSV
          </ButtonLink>
          </div>
        </Disclosure>
        </div>}
      />

      <div role="group" aria-label="Quick looks" data-testid="audit.quick" className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-semibold text-body">{items.length} recent events. Look at:</span>
        {entityMix.map(([key,n])=>{
          const selected=query.f_about.length===1&&query.f_about[0]===key;
          const label=TPO_AUDIT_ABOUT_CATEGORIES.find(item=>item.value===key)?.label??key;
          return <TextLink variant="bare" key={key} href={entityHref(selected?null:key)} role="button" aria-pressed={selected}
            data-testid={"audit.quick."+key} className={"inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold "+(selected?"border-primary bg-primary text-on-primary":"border-border bg-surface text-body hover:bg-primary-subtle")}>
            {label} · <strong>{n}</strong>
          </TextLink>;
        })}
      </div>
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
            label: "Recent actors (this page)",
            count: recentActors,
          },
        ].map((metric) => (
          <StatTile {...(tpoTileStyles["tile"]===undefined?{}:{className:tpoTileStyles["tile"]})} key={metric.label} label={metric.label} value={metric.count} />
        ))}
      </section>

      {summary.total>5000?<p role="status" className="border-l-2 border-warning bg-warning-subtle px-3 py-2 text-sm text-body">
        The audit export is limited to the first 5,000 matching events ({summary.total} match).
        Narrow the From and To dates above, then export each range to include all events.
      </p>:null}
      <p className="text-xs text-muted-foreground leading-5">About and What happened: use the category tabs. Who and When: use the actor/entity view and date filters. The actor view contains additional scoped audit filters.</p>
      <TpoAuditSavedViews
       filters={{kind:query.kind,...(query.from===undefined?{}:{from:query.from}),...(query.to===undefined?{}:{to:query.to}),q:query.q,who:query.who}}/>
      <section className="min-w-0 overflow-hidden rounded-[14px] border border-[var(--lms-canvas-border)] bg-surface shadow-(--lms-elevation-3)">
       <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] px-[12px] py-3 md:px-[20px] md:py-[16px]">
        <div className="min-w-0">
         <p className="text-xs text-muted-foreground">
          {query.from&&query.to
            ? "Everything from "+query.from+" to "+query.to+"."
            : "The latest "+items.length+" events. Pick dates to see everything in a period."}
         </p>
         {recentLatest?<p className="mt-1 text-xs text-muted-foreground">Latest: {auditDateTime(recentLatest)}</p>:null}
        </div>
        <nav aria-label="When" className="flex flex-wrap gap-2">
         {quickLooks.map(look=><FilterChipLink key={look.label}
          href={quickHref(query.from===look.from&&query.to===look.to?"":look.from,query.from===look.from&&query.to===look.to?"":look.to)}
          selected={query.from===look.from&&query.to===look.to}>{look.label}</FilterChipLink>)}
        </nav>
       </div>
       <div className="min-w-0 px-3 py-4 md:px-[20px] md:pb-5">
      <Tabs ariaLabel="Filter audit by category" renderPanel={false} value={query.kind} items={[{kind:"ALL" as const,label:"All",count:query.kind==="ALL"?summary.total:null},...TPO_AUDIT_KINDS.map(kind=>({kind,label:TPO_AUDIT_KIND_LABELS[kind],count:query.kind==="ALL"?summary.byKind[kind]:null}))].map(item=>({value:item.kind,label:item.label,...(item.count==null?{}:{count:item.count}),href:tpoAuditHref({...paginationFilters,kind:item.kind,page:1})}))}/>
      <section aria-labelledby="section-audit-filters" className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
        <Heading level={2} size="base" id="section-audit-filters" className="m-0 text-foreground">
          Filter the audit log
        </Heading>

        <form role="search" aria-label="tpo audit filters"
          method="get"
          action="/tpo/audit"
          className="mt-3 grid min-w-0 grid-cols-1 gap-[8px] sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="contents">          <Label stack>
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
          </Label>

          <Label stack>
            From (IST)
            <DateInput mode="date"
              name="from"
              aria-label="From"
              defaultValue={query.from ?? ""}
              className="min-h-11 md:min-h-9"
            />
          </Label>

          <Label stack>
            To (IST)
            <DateInput mode="date"
              name="to"
              aria-label="To"
              defaultValue={query.to ?? ""}
              className="min-h-11 md:min-h-9"
            />
          </Label>

          <Label stack>
            Search
            <Input
              type="search"
              name="q"
              maxLength={120}
              defaultValue={query.q}
              placeholder="Search"
              className="min-h-11 md:min-h-9"
            />
          </Label>

          </div>
          <Disclosure title="Who · Rows per page" className="min-w-0 border-0 sm:col-span-2 lg:col-span-4" defaultOpen={Boolean(query.who || pageSize!==25)} contentClassName="pt-3">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <Label stack>Who
            <Input type="search" name="who" maxLength={100} defaultValue={query.who}
              placeholder="Actor name contains…" className="min-h-11 md:min-h-9"/>
          </Label>
          <PageSizeSelect name="pageSize" defaultValue={String(pageSize)} options={[25,50,100]} />
            </div>
          </Disclosure>

          <input type="hidden" name="f_about" value={query.f_about.join(",")} />
          <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:col-span-2 lg:col-span-4">
            <Button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-6 sm:w-auto text-sm font-semibold text-on-primary hover:bg-primary-hover  md:min-h-9"
            >
              Apply filters
            </Button>
            <ButtonLink variant="secondary"
              href="/tpo/audit"
            >
              Clear filters
            </ButtonLink>
          </div>
        </form>
      </section>

      {result.unavailableSources.length > 0 ? (
        <section
          role="status"
          className="border-l-2 border-border bg-surface-subtle px-3 py-2 text-sm leading-6 text-body"
        >
          Some sharing activity could not be loaded. The totals shown may be incomplete. Try again later.
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Heading level={2} className="m-0 text-[length:var(--lms-font-lg)] leading-7 text-[var(--lms-heading)]">
              Event history
            </Heading>
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
                ? (query.q||query.who||query.from||query.to||query.kind!=="ALL"||query.f_about.length?"No rows match the current filters":"Nothing logged yet")
                : "No records on this page"
            }
            description={
              summary.total === 0
                ? "Every drive, decision and setting change your team makes shows up here."
                : "This page number is outside the available result range. Return to the first page or adjust the filters."
            }
            action={<TextLink href={summary.total===0?"/tpo/audit":tpoAuditHref({...paginationFilters,page:1})}
              className="md:min-h-9 inline-flex min-h-11 items-center">{summary.total===0?"Clear filters":"First page"}</TextLink>}
          />
        ) : (
          <TpoAuditGrid key={context.membership.id+":"+gridRefreshQuery.toString()}
       rows={items} refreshHref={gridRefreshHref}/>
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
              <ButtonLink variant="secondary"
                href={tpoAuditHref({
                  ...paginationFilters,
                  page: page - 1,
                })}
              >
                ← Previous
              </ButtonLink>
            ) : null}

            {page > 1 ? (
              <ButtonLink variant="secondary"
                href={tpoAuditHref({
                  ...paginationFilters,
                  page: 1,
                })}
              >
                First page
              </ButtonLink>
            ) : null}

            {page < totalPages ? (
              <ButtonLink variant="secondary"
                href={tpoAuditHref({
                  ...paginationFilters,
                  page: page + 1,
                })}
              >
                Next →
              </ButtonLink>
            ) : null}
          </div>
        </nav>:null}
      </section>

       </div>
      </section>
      <p role="note" className="text-xs leading-5 text-muted-foreground">Audit totals count source records, not necessarily unique actions. Related records are retained so no recorded decision is silently discarded.</p>
      <p className="text-xs leading-5 text-muted-foreground">
        This history shows recorded placement decisions, changes, sharing and access. Sensitive personal details are hidden. Earlier changes may not appear if they were not recorded at the time.
      </p>
    </div>
    </TpoAuditStaleSnapshot>
  );
}
