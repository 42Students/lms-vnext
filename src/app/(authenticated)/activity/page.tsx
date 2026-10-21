import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ActivityCenter,
  type ActivityCenterGroup,
  RAW_AUDIT_FORENSIC_HEADERS,
  RAW_AUDIT_MISSING_TRANSPORT,
} from "@/components/activity/activity-center";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {sanitizeActivityMetadata} from "@/modules/activity/metadata-sanitizer";
import {
  hasMembershipRole,
  isSuperAdmin,
} from "@/modules/identity/context";
import {
  listActivityEvents,
} from "@/modules/activity/service";
import { listColleges } from "@/modules/colleges/service";
import {
  ACTIVITY_IMPORTANCE,
  ACTIVITY_MODULES,
} from "@/modules/activity/taxonomy";


/** Wall-clock read kept out of render bodies (React purity rule). */
function currentTimeMs(){return Date.now();}

type SearchParams = Promise<
  Record<
    string,
    string | string[] | undefined
  >
>;

function one(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

const inputClass = "w-full min-w-0";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const context =
    await getCurrentRequestContext();

  if (
    !isSuperAdmin(context) &&
    !hasMembershipRole(
      context,
      "COLLEGE_ADMIN",
    )
  ) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const moduleValue = one(
    params.module,
  );
  const importanceValue = one(
    params.importance,
  );
  const preset = one(params.view);
  const presetNames = ["important","setup","people","teaching","projects","all"] as const;
  type PresetName = typeof presetNames[number];
  const validPreset = presetNames.find(name=>name===preset);
  const explicitFilter = Boolean(moduleValue || importanceValue ||
    one(params.eventType) || one(params.subjectType) ||
    one(params.subjectId) || one(params.actorUserId) ||
    one(params.actorName) || one(params.q));
  const selectedPreset:PresetName = validPreset ??
    (explicitFilter ? "all" : "important");
  // The Important tab is an OR over HIGH + CRITICAL, not HIGH alone.
  const importantOnly = selectedPreset==="important" && !importanceValue;
  const categoryModule =
    selectedPreset==="setup"?"ACADEMICS":
    selectedPreset==="people"?"IDENTITY":
    selectedPreset==="teaching"?"COURSES":
    selectedPreset==="projects"?"PROJECTS":undefined;
  const effectiveModule=moduleValue??categoryModule;
  const selectedCollegeId=isSuperAdmin(context)?context.adminScope?.collegeId??null:null;
  const selectedOrganizationId=isSuperAdmin(context)?context.adminScope?.organizationId??null:null;
  // A college-filter directory failure is recoverable: it must not turn a
  // successfully scoped activity read into a route-level 500 error.
  let collegeOptions: Awaited<ReturnType<typeof listColleges>> = [];
  let collegeOptionsFailed = false;
  if (isSuperAdmin(context) && !selectedCollegeId) {
    try {
      collegeOptions = (await listColleges(context)).filter(college=>
        !selectedOrganizationId || college.organizationId===selectedOrganizationId);
    } catch {
      collegeOptionsFailed = true;
    }
  }
  const istDay=(date:Date)=>new Intl.DateTimeFormat("en-CA",{
   timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).format(date);
  const today=istDay(new Date());
  const ago=(days:number)=>istDay(new Date(currentTimeMs()-days*86400000));
  const range=one(params.range);
  const rawMode=one(params.mode)==="raw" && isSuperAdmin(context);
  const rawSize=one(params.size);
  const pageSize=rawMode && (rawSize==="50"||rawSize==="100")?Number(rawSize):25;
  const selectedRange=range==="today"||range==="7d"||range==="30d"?range:
    range==="ALL"?"all":"30d";
  // Raw forensic lookups default to all-time, as in legacy Audit Logs.
  // The Important activity feed still defaults to the last 30 IST days.
  const forensicLookup=selectedPreset==="all" && Boolean(
    one(params.actorUserId)||one(params.actorName)||one(params.eventType)||
    one(params.subjectType)||one(params.subjectId)||one(params.q));
  const defaultFrom=one(params.from)??(!one(params.to)&&!forensicLookup?
    range==="ALL"?undefined:
    range==="today"?today:range==="7d"?ago(6):ago(29):undefined);
  const quick=(from?:string,to?:string,view:PresetName=selectedPreset,
    rangeKey:string|undefined=range)=>{
   const q=new URLSearchParams({
    ...(from?{from}:{}),...(to?{to}:{}),
    ...(!from&&!to?{range:"ALL"}:rangeKey?{range:rangeKey}:{}),
    view,
    ...(rawMode?{mode:"raw"}:{}),
    ...(selectedCollegeId?{}:one(params.collegeId)?{collegeId:one(params.collegeId)!}:{})
   });
   return "/activity?"+q.toString();
  };
  const presetLinks=[
   {id:"important" as const,name:"Important",href:quick(defaultFrom,one(params.to),"important",range)},
   {id:"setup" as const,name:"Academic setup",href:quick(defaultFrom,one(params.to),"setup",range)},
   {id:"people" as const,name:"People & access",href:quick(defaultFrom,one(params.to),"people",range)},
   {id:"teaching" as const,name:"Teaching",href:quick(defaultFrom,one(params.to),"teaching",range)},
   {id:"projects" as const,name:"Projects",href:quick(defaultFrom,one(params.to),"projects",range)},
   {id:"all" as const,name:"Everything",href:quick(defaultFrom,one(params.to),"all",range)},
  ];
  const retryQuery=new URLSearchParams();
  for(const [key,value] of Object.entries(params)){
    if(typeof value==="string" && value.length<=500)retryQuery.set(key,value);
  }
  const retryHref="/activity"+(retryQuery.size?"?"+retryQuery.toString():"");
  let result: Awaited<ReturnType<typeof listActivityEvents>>;
  try {
    result = await listActivityEvents(
      context,
      {
        module: effectiveModule as
          | (typeof ACTIVITY_MODULES)[number]
          | undefined,
        importance: importanceValue as
          | (typeof ACTIVITY_IMPORTANCE)[number]
          | undefined,
        importantOnly,
        collegeId: selectedCollegeId??one(params.collegeId),
        organizationId: selectedCollegeId?undefined:selectedOrganizationId??undefined,
        actorUserId: one(params.actorUserId),
        eventType: one(params.eventType),
        subjectType: one(params.subjectType),
        subjectId: one(params.subjectId),
        actorName: isSuperAdmin(context) ? one(params.actorName)?.trim() || undefined : undefined,
        q: isSuperAdmin(context) ? one(params.q)?.trim() || undefined : undefined,
        from: defaultFrom,
        to: one(params.to),
        beforeOccurredAt: one(params.beforeOccurredAt),
        beforeId: one(params.beforeId),
        limit: pageSize,
      },
    );
  } catch {
    // Do not show an empty-event state for an unsuccessful service fetch.
    // The same query/scope is kept intact for a deliberate retry.
    return <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader title="Activity Log" />
      <ErrorState title="Couldn't load activity."
        description="Your filters have been preserved. Please try again."
        action={<a href={retryHref}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9">
          Retry
        </a>} />
    </div>;
  }

  const groups: ActivityCenterGroup[] =
    result.groups.map((group) => ({
      key: group.key,
      count: group.count,
      latest: {
        event: {
          id: group.latest.event.id,
          module:
            group.latest.event.module,
          eventType:
            group.latest.event.eventType,
          importance:
            group.latest.event
              .importance,
          subjectType:
            group.latest.event
              .subjectType,
          subjectId:
            group.latest.event
              .subjectId,
          subjectLabel:
            group.latest.event
              .subjectLabel,
          summary:
            group.latest.event.summary,
          metadata:sanitizeActivityMetadata(group.latest.event.metadata),
          occurredAt:
            group.latest.event.occurredAt.toISOString(),
        },
        actor: group.latest.actor,
      },
      earliest: {
        event: {
          occurredAt:
            group.earliest.event.occurredAt.toISOString(),
        },
      },
    }));

  const nextParams =
    new URLSearchParams();
  for (const name of [
    "view",
    "module",
    "importance",
    "actorUserId",
    "eventType",
    "subjectType",
    "subjectId",
    "actorName",
    "q",
    "mode",
    "size",
    "collegeId",
    "from",
    "to",
  ]) {
    const value = name==="view"?selectedPreset:one(params[name]);
    if (value) {
      if ((name === "actorName" || name === "q") && !isSuperAdmin(context)) continue;
      nextParams.set(name, value);
    }
  }
  if(defaultFrom)nextParams.set("from",defaultFrom);
  if(selectedCollegeId)nextParams.delete("collegeId");
  // Export starts from the newest matching activity, without an older-page cursor.
  const exportParams = new URLSearchParams(nextParams);
  // The current CSV export API has no HIGH-or-CRITICAL category contract.
  // Never mislabel a broader "everything" export as an Important-only export.
  exportParams.delete("view");
  exportParams.delete("mode");
  exportParams.delete("size");
  if(effectiveModule && !moduleValue)exportParams.set("module",effectiveModule);
  // An explicit all-time list must stay all-time when the user loads older events.
  // Keep this UI-only flag out of the strict CSV export query contract.
  if (range === "ALL" && !defaultFrom && !one(params.to)) nextParams.set("range", "ALL");
  if (result.nextCursor) {
    nextParams.set(
      "beforeOccurredAt",
      result.nextCursor.beforeOccurredAt.toISOString(),
    );
    nextParams.set(
      "beforeId",
      result.nextCursor.beforeId,
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader
        title="Activity Log"
        description="Meaningful college changes, grouped to reduce noise. Low-value request logs stay out of this workspace."
        actions={isSuperAdmin(context) || hasMembershipRole(context, "COLLEGE_ADMIN") ? (
          <div className="flex w-full min-w-0 flex-col items-stretch gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-end">
          {result.items.length===0?<span aria-disabled="true" className="inline-flex min-h-11 items-center text-sm text-muted-foreground md:min-h-9">
            Export unavailable (no matching activity)
          </span>:importantOnly ? <span className="flex min-h-11 items-center text-xs text-muted-foreground md:min-h-9">
            Important-only CSV export requires the category-aware export API.
          </span> : <a href={(isSuperAdmin(context) ? "/api/activity/admin-export" : "/api/activity/college-export") +
            (exportParams.size ? "?" + exportParams.toString() : "")}
            className="inline-flex min-h-11 w-full items-center justify-center px-2 text-sm font-semibold text-primary-text underline underline-offset-4 hover:bg-[rgba(38,186,199,0.07)] md:w-auto hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)]">
            Export CSV
          </a>}
          <a href={retryHref}
            className="inline-flex min-h-11 w-full items-center justify-center px-2 text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9 md:w-auto focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Refresh
          </a>
          {isSuperAdmin(context) ? <Link href="/tracker/audit-findings"
            className="inline-flex min-h-11 w-full items-center justify-center px-2 text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)]">
            Open audit findings board →
          </Link> : null}
          </div>
        ) : undefined}
      />

      {isSuperAdmin(context)?<section role="status" aria-label="Activity scope"
        className="flex min-w-0 gap-3 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-primary-subtle)] p-3 text-sm text-body">
        <span aria-hidden="true" className="shrink-0 font-bold text-primary-text">ⓘ</span>
        <div className="space-y-1">
          <p className="font-semibold">{selectedCollegeId||one(params.collegeId)?"Showing this college":
            selectedOrganizationId?"Showing this organization":"Platform-wide activity"}</p>
          <p>{selectedCollegeId||one(params.collegeId)?
            "Activity is pinned to the selected college. Change the header scope to inspect another college, or clear it for platform-wide activity.":
            selectedOrganizationId?
            "Activity is pinned to the selected organization. Choose a college for a narrower operational view, or clear scope for platform-wide activity.":
            "Important changes across all organizations and colleges are shown first. Use the header scope when you need to investigate one tenant."}</p>
        </div>
      </section>:null}
      {collegeOptionsFailed ? (
        <div role="status" className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border py-3 text-sm text-body">
          <span>College filter options could not load. Your activity results are still scoped to the current administrator access.</span>
          <a href={retryHref} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9">Retry</a>
        </div>
      ) : null}
      {isSuperAdmin(context)?<nav aria-label="Activity Log filters" className="space-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-3 border-b border-[var(--lms-canvas-border)] pb-3">
          <div role="group" aria-label="Activity category" className="inline-flex max-w-full flex-wrap gap-1 rounded-[var(--lms-control-radius)] bg-muted p-1">
            {presetLinks.map(link=><Link key={link.id} href={link.href}
              aria-current={selectedPreset===link.id?"page":undefined}
              className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 md:min-h-9 "+
                (selectedPreset===link.id?"bg-surface text-primary-text shadow-sm":"text-body hover:bg-surface")}>
              {link.name}</Link>)}
          </div>
          <div role="group" aria-label="Activity date range" className="inline-flex flex-wrap gap-1 rounded-[var(--lms-control-radius)] bg-muted p-1">
            {([
              {key:"today",label:"Today",href:quick(today,today,selectedPreset,"today")},
              {key:"7d",label:"7 days",href:quick(ago(7),today,selectedPreset,"7d")},
              {key:"30d",label:"30 days",href:quick(ago(30),today,selectedPreset,"30d")},
              {key:"all",label:"All time",href:quick(undefined,undefined,selectedPreset,"ALL")},
            ] as const).map(item=><Link key={item.key} href={item.href}
              aria-current={selectedRange===item.key?"page":undefined}
              className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 md:min-h-9 "+
                (selectedRange===item.key?"bg-surface text-primary-text shadow-sm":"text-body hover:bg-surface")}>{item.label}</Link>)}
          </div>
          <Link href={retryHref} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Refresh</Link>
          <span role="status" className="text-xs tabular-nums text-muted-foreground">{result.items.length} raw events loaded</span>
        </div>
        {selectedPreset==="important"?<p className="text-xs text-muted-foreground">Deletions and restores, promotions, suspensions, impersonation, module access and feature changes, and identity views.</p>:null}
        <div role="group" aria-label="Activity display" className="flex flex-wrap gap-3 text-sm">
          <Link href={"/activity?"+new URLSearchParams({...Object.fromEntries(retryQuery),mode:"grouped"}).toString()}
            aria-current={!rawMode?"page":undefined} className="min-h-9 font-semibold text-link underline">Activity feed</Link>
          <Link href={"/activity?"+new URLSearchParams({...Object.fromEntries(retryQuery),mode:"raw"}).toString()}
            aria-current={rawMode?"page":undefined} className="min-h-9 font-semibold text-link underline">Raw Audit Logs</Link>
        </div>
      </nav>:null}
      <details className="min-w-0 border-b border-border pb-3" open={explicitFilter||Boolean(one(params.collegeId))||rawMode}>
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-link underline md:min-h-9">
          {rawMode?"Audit Logs — advanced search":"More filters"}
        </summary>
      <form aria-label="Filter activity log" className="grid min-w-0 grid-cols-1 items-end gap-[8px] border-y border-border py-4 md:grid-cols-2 xl:grid-cols-4">
        <input type="hidden" name="view" value={selectedPreset} />
        {rawMode?<input type="hidden" name="mode" value="raw"/>:null}
        {rawMode?<label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rows per page
          <Select name="size" defaultValue={String(pageSize)}>
            <option value="25">25</option><option value="50">50</option><option value="100">100</option>
          </Select>
        </label>:null}
        {collegeOptionsFailed && one(params.collegeId) ? (
          <input type="hidden" name="collegeId" value={one(params.collegeId)} />
        ) : null}
        {isSuperAdmin(context) && !selectedCollegeId && !collegeOptionsFailed ? (
          <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold leading-4 text-body">College</span>
            <Select name="collegeId" defaultValue={one(params.collegeId) ?? ""} className={inputClass}>
              <option value="">Current admin safety scope</option>
              {collegeOptions.map(college => <option key={college.id} value={college.id}>
                {college.name} ({college.code})
              </option>)}
            </Select>
          </label>
        ) : null}
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          <span className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold leading-4 text-body">
            Module
          </span>
          <Select
            className={inputClass}
            name="module"
            defaultValue={
              effectiveModule ?? ""
            }
          >
            <option value="">
              All modules
            </option>
            {ACTIVITY_MODULES.map(
              (module) => (
                <option
                  key={module}
                  value={module}
                >
                  {module}
                </option>
              ),
            )}
          </Select>
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          <span className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold leading-4 text-body">
            Importance
          </span>
          <Select
            className={inputClass}
            name="importance"
            defaultValue={
              importanceValue ?? ""
            }
          >
            <option value="">
              All importance
            </option>
            {ACTIVITY_IMPORTANCE.map(
              (importance) => (
                <option
                  key={importance}
                  value={importance}
                >
                  {importance}
                </option>
              ),
            )}
          </Select>
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          <span className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold leading-4 text-body">
            From (IST)
          </span>
          <DateInput mode="date"
            className={inputClass}
            name="from"
            defaultValue={defaultFrom}
          />
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          <span className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold leading-4 text-body">
            To (IST)
          </span>
          <DateInput mode="date"
            className={inputClass}
            name="to"
            defaultValue={one(params.to)}
          />
        </label>
        <details open={Boolean(one(params.eventType)||one(params.subjectType)||one(params.subjectId)||one(params.actorName)||one(params.q)||one(params.actorUserId)) || undefined}
          className="group min-w-0 border-t border-[var(--lms-canvas-border)] md:col-span-2 xl:col-span-4">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between text-sm font-semibold text-[var(--lms-body-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">More filters<span aria-hidden="true">⌄</span></summary>
          <div className="grid min-w-0 gap-[var(--lms-space-3)] pb-[var(--lms-space-4)] md:grid-cols-2 xl:grid-cols-4">
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          <span className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold leading-4 text-body">
            Event type
          </span>
          <Input
            className={inputClass}
            name="eventType"
            defaultValue={one(
              params.eventType,
            )}
            placeholder="placements.offer.issued"
          />
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          <span className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold leading-4 text-body">
            Subject type
          </span>
          <Input
            className={inputClass}
            name="subjectType"
            defaultValue={one(
              params.subjectType,
            )}
            placeholder="placement_offer"
          />
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          <span className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold leading-4 text-body">Subject / entity ID</span>
          <Input className={inputClass} name="subjectId" maxLength={500}
            defaultValue={one(params.subjectId)} placeholder="Exact entity ID" />
        </label>
        {isSuperAdmin(context) ? <>
          <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"><span className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold leading-4 text-body">Actor name</span>
            <Input type="search" className={inputClass} name="actorName" maxLength={100}
              defaultValue={one(params.actorName)} placeholder="Name contains…" /></label>
          <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"><span className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold leading-4 text-body">Event / entity search</span>
            <Input type="search" className={inputClass} name="q" maxLength={100}
              defaultValue={one(params.q)} placeholder="Summary, event or entity contains…" /></label>
        </> : null}
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          <span className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold leading-4 text-body">
            Actor user ID
          </span>
          <Input
            className={inputClass}
            name="actorUserId"
            defaultValue={one(
              params.actorUserId,
            )}
            placeholder="Optional UUID"
          />
        </label>
          </div>
        </details>
        <div className="flex min-w-0 flex-wrap items-end gap-[var(--lms-space-2)] md:col-span-2 xl:col-span-4">
          <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>
          <Link
            href="/activity?view=important"
            className="inline-flex min-h-11 w-full items-center justify-center px-3 text-sm font-semibold text-primary-text underline underline-offset-4 md:w-auto focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] md:min-h-9"
          >
            Reset
          </Link>
        </div>
      </form>
      </details>

      {rawMode ? (
        <section aria-labelledby="raw-audit-log" className="min-w-0 space-y-3">
          <h2 id="raw-audit-log" className="text-lg font-semibold text-[var(--lms-heading)]">Raw Audit Logs</h2>
          <p className="text-sm text-muted-foreground">
            Raw events in newest-first order. IP addresses are not retained in vNext;
            the audit record uses privacy-safe provenance instead.
          </p>
          <div className="w-full min-w-0 overflow-x-auto rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)]">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead className="bg-[var(--lms-neutral-100)] text-[var(--lms-heading)]">
                <tr>{RAW_AUDIT_FORENSIC_HEADERS.map(label=>(
                  <th key={label} scope="col" className="px-3 py-3 font-semibold">{label}</th>
                ))}</tr>
              </thead>
              <tbody>
                {result.items.map(({event,actor})=>(
                  <tr key={event.id} className="border-t border-[var(--lms-canvas-border)] align-top">
                    <td className="whitespace-nowrap px-3 py-3">{new Intl.DateTimeFormat("en-IN",{
                      timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
                    }).format(event.occurredAt)}</td>
                    <td className="max-w-[240px] break-all px-3 py-3">{event.eventType}</td>
                    <td className="max-w-[220px] break-words px-3 py-3">
                      <span className="block text-xs text-muted-foreground">{event.subjectType}</span>
                      <span>{event.subjectLabel??event.subjectId}</span>
                    </td>
                    <td className="break-all px-3 py-3">{event.organizationId??"—"}</td>
                    <td className="break-all px-3 py-3">{event.collegeId??"—"}</td>
                    <td className="max-w-[180px] break-words px-3 py-3">{actor?.displayName??actor?.email??"System"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{RAW_AUDIT_MISSING_TRANSPORT}</td>
                    <td className="px-3 py-3 text-muted-foreground">{RAW_AUDIT_MISSING_TRANSPORT}</td>
                  </tr>
                ))}
                {result.items.length===0?<tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">No audit logs match these filters.</td></tr>:null}
              </tbody>
            </table>
          </div>
          {result.nextCursor ? <Link href={"/activity?"+nextParams.toString()}
            className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9">
            Load older events ({result.remainingCount} remaining)
          </Link> : null}
        </section>
      ) : <ActivityCenter
        nextRemaining={result.remainingCount}
        groups={groups}
        todayKey={today}
        yesterdayKey={ago(1)}
        nextHref={result.nextCursor ? "/activity?"+nextParams.toString() : null}
      />}
    </div>
  );
}
