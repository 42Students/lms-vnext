import { getCurrentRequestContext } from "@/auth/request-context";
import {Fragment,type ReactNode} from "react";
import {ProjectAuditActionSelect,ProjectAuditRefreshButton} from "@/components/projects/project-audit-filters";
import {StatusBadge} from "@/components/ui/status-badge";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import {ProjectAuditPageExport} from "@/components/projects/project-audit-page-export";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";
import { Banner } from "@/components/ui/banner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import {
  listActivityEvents,
} from "@/modules/activity/service";
import {
  ACTIVITY_IMPORTANCE,
  ACTIVITY_EVENT_TYPES,
} from "@/modules/activity/taxonomy";
import { parseProjectAdminAuditQuery,legacyProjectAuditActions,
 projectLegacyAuditLink } from "@/modules/projects/admin-audit-query-model";
import { mayReadGlobalProjectAudit } from "@/modules/projects/admin-audit-access-model";
import {z} from "zod";

const destructiveProjectEventTypes=new Set<string>([
 ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_ARCHIVED,
 ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_DELETED,
 ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_UNASSIGNED,
 ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_COLLEGE_REVOKED,
 ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_ARCHIVED,
 ACTIVITY_EVENT_TYPES.PROJECTS_TEAM_MEMBER_ENDED,
 ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_ARCHIVED,
]);
function linkedWorkspaceId(event:{
 subjectId:string;subjectType:string;metadata:Record<string,unknown>;
}):string|null{
 const candidate=event.subjectType==="project_instance"||event.subjectType==="project"
   ?event.subjectId:event.metadata.projectId;
 return typeof candidate==="string"&&z.string().uuid().safeParse(candidate).success
   ?candidate:null;
}



/** Wall-clock read kept out of render bodies (React purity rule). */
function currentTimeMs(){return Date.now();}

type SearchParams = Record<
  string,
  string | string[] | undefined
>;

function istDate(date:Date){
 const parts=Intl.DateTimeFormat("en-US",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
 }).formatToParts(date);
 const part=(type:string)=>parts.find(p=>p.type===type)?.value??"";
 return part("year")+"-"+part("month")+"-"+part("day");
}
const inputClass = "w-full";

/** Project-only event labels never imply a destructive action was reversible. */
function projectActionLabel(raw:string){
 const key=raw.replace(/^projects[._]/i,"").replaceAll("_"," ").replaceAll("."," ");
 const phrase=key.trim().toLowerCase();
 return phrase?phrase[0].toUpperCase()+phrase.slice(1):"Updated";
}
function destructiveProjectAction(raw:string){
 return /(^|[._])(archive|delete|deleted|revoke|revoked|remove|removed|unassign|rollback|restore)([._]|$)/i.test(raw);
}
function auditEntityType(raw:string){
 const type=raw.toLowerCase();
 if(type.includes("task"))return "Task";
 if(type.includes("template"))return "Template";
 if(type.includes("project")||type.includes("workspace"))return "Workspace";
 return type.replaceAll("_"," ").replaceAll("."," ")||"Entity";
}
function projectEventTime(value:Date){
 return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(value)+" IST";
}
function projectEventDay(value:Date){
 return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"long",day:"2-digit",
  month:"short",year:"numeric"}).format(value);
}
function projectEventDayKey(value:Date){
 return new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(value);
}
/** Legacy payloads include arrays, nested maps and occasionally JSON serialized as text. */
function auditDetailValue(value:unknown,depth=0):ReactNode{
 if(depth>=12)return <span className="text-muted-foreground">Nested data continues beyond this display.</span>;
 if(value===null||value===undefined||value==="")return "—";
 if(typeof value==="string"){
  const text=value.trim();
  if(text.length>2&&(text.startsWith("{")||text.startsWith("["))){
   try{return auditDetailValue(JSON.parse(text) as unknown,depth+1);}
   catch{return <span className="whitespace-pre-wrap break-all">{value}</span>;}
  }
  return <span className="whitespace-pre-wrap break-all">{value}</span>;
 }
 if(typeof value==="boolean"||typeof value==="number")return String(value);
 if(Array.isArray(value))return <div className="flex flex-wrap items-start gap-2">
  {value.slice(0,50).map((item,index)=><span key={index}
   className="max-w-full rounded-[var(--lms-control-radius)] border border-border px-2 py-1 text-xs">
   {auditDetailValue(item,depth+1)}
  </span>)}
  {value.length>50?<span className="text-muted-foreground">+{value.length-50} more values</span>:null}
 </div>;
 if(typeof value==="object")return <dl className="min-w-0 space-y-2">
  {Object.entries(value as Record<string,unknown>).slice(0,50).map(([key,item])=><div
   key={key} className="min-w-0 border-b border-border pb-2">
   <dt className="break-all text-xs font-semibold text-muted-foreground">{key.replaceAll("_"," ")}</dt>
   <dd className="mt-1 min-w-0 break-words text-sm text-body">{auditDetailValue(item,depth+1)}</dd>
  </div>)}
  {Object.keys(value).length>50?<div className="text-xs text-muted-foreground">Further metadata fields are not shown.</div>:null}
 </dl>;
 return String(value);
}


export async function ProjectAdminAuditPage({
  basePath,
  searchParams,
}: {
  basePath:
    | "/admin/projects"
    | "/college/projects";
  searchParams: SearchParams;
}) {
  const context =
    await getCurrentRequestContext();

  // A global Super Admin must be able to inspect template events that have no
  // college scope. The activity service itself enforces platform permissions.
  const globalTemplateAudit = mayReadGlobalProjectAudit(context);

  const legacyLink=projectLegacyAuditLink(searchParams,new Date());
  const filters = parseProjectAdminAuditQuery(legacyLink.params);
  const { eventType, importance, subjectType, subjectId, from, to } = filters;
  const allTime=!from&&!to;
  const pageLimit=allTime?25:200;

  const activityRead =
    await listActivityEvents(
      context,
      {
        module: "PROJECTS",
        importance,
        eventType,
        subjectType,
        subjectId,
        from,
        to,
        beforeOccurredAt: filters.beforeOccurredAt,
        beforeId: filters.beforeId,
        limit: pageLimit,
      },
    ).then(value => ({ ok: true as const, value }))
     .catch(() => ({ ok: false as const }));
  if (!activityRead.ok) return <div className="min-w-0 space-y-6">
    <PageHeader title="Project audit"
      description="Who changed what, and when — check daily for anything unexpected."
      actions={<PageBackLink href={basePath} label="Project workspaces" />} />
    <ProjectAdminNav basePath={basePath} active="audit" />
    <ErrorState title="Audit log could not be loaded"
      description="Failed to load audit log. Your filters have not changed."
      action={<Link href={basePath+"/audit"} className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Retry audit</Link>} />
  </div>;
  const result = activityRead.value;
  const rawEvents=result.items;
  const coveredEvents=rawEvents.length;
  const peopleCount=new Set(rawEvents.map(item=>item.actor.id)
    .filter((id):id is string=>Boolean(id))).size;
  const destructiveCount=rawEvents.filter(item=>destructiveProjectEventTypes.has(
    item.event.eventType)).length;
  const partialCoverage=Boolean(result.nextCursor);
  const legacyOptions=Object.entries(legacyProjectAuditActions).sort(([a],[b])=>a.localeCompare(b));

  const nextParams =
    new URLSearchParams();
  if (eventType) {
    nextParams.set("action", eventType);
  }
  if (importance) {
    nextParams.set(
      "importance",
      importance,
    );
  }
  if (subjectType) {
    nextParams.set(
      "subjectType",
      subjectType,
    );
  }
  if(subjectId)nextParams.set("subjectId",subjectId);
  if (from) {
    nextParams.set("from", from);
  }
  if (to) {
    nextParams.set("to", to);
  }
  const preservedRefreshQuery = nextParams.toString();
  const refreshHref = basePath + "/audit" + (preservedRefreshQuery ? "?" + preservedRefreshQuery : "");
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

  // Show an active underline only when a saved date filter is one of the
  // preset ranges. A custom range should not falsely appear as "All time".
  const auditRangeOptions = [
    { value: "today", label: "Today", days: 0 },
    { value: "7-days", label: "7 days", days: 6 },
    { value: "30-days", label: "30 days", days: 29 },
    { value: "all-time", label: "All time", days: null },
  ] as const;
  const referenceTimeMs = currentTimeMs();
  const rangeFrom = (days: number | null) =>
    days === null ? null : istDate(new Date(referenceTimeMs - days * 86400000));
  const selectedAuditRange = to ? "custom" :
    auditRangeOptions.find(item => rangeFrom(item.days) === (from ?? null))?.value ?? "custom";
  const auditRangeTabs = auditRangeOptions.map(item => {
    const params = new URLSearchParams();
    if (eventType) params.set("action", eventType);
    if (importance) params.set("importance", importance);
    if (subjectType) params.set("subjectType", subjectType);
    if (subjectId) params.set("subjectId", subjectId);
    const start = rangeFrom(item.days);
    if (start) params.set("from", start);
    return { value: item.value, label: item.label, href: basePath + "/audit?" + params.toString() };
  });

  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <div className="min-w-0">
        <PageBackLink href={basePath} label="Project workspaces" />
        <PageHeader title="Project audit"
          description={globalTemplateAudit?"Platform-wide Projects activity includes global template changes.":"Who changed what, and when — check daily for anything unexpected."}
          actions={<div className="flex flex-wrap gap-2">
            <ProjectAuditRefreshButton/>
            <Link href={basePath==="/admin/projects"?"/admin/audit":"/college/activity"}
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link hover:bg-primary-subtle md:min-h-9">View activity log</Link>
          </div>}/>
      </div>
      <ProjectAdminNav basePath={basePath} active="audit" />

      {legacyLink.needsCursorReplay?<Banner tone="warning" role="status">
        This old audit link requested page {legacyLink.legacyPage+1}.
        Audit now uses a chronological cursor; the first matching events are shown.
        Use Load older events to continue without skipping changes.
      </Banner>:null}
      {legacyLink.invalidLegacyLink?<Banner tone="warning" role="alert">
        Some legacy audit link settings were invalid. Safe filters were retained.
      </Banner>:null}
      {filters.ignoredInvalidFilters ? (
        <Banner tone="warning" role="alert">
          Some audit filters were invalid and have been ignored. Review the filters below and apply them again.
        </Banner>
      ) : null}

      <nav aria-label="Audit time range" className="flex flex-wrap items-center gap-2">
        {auditRangeTabs.map(item=><Link key={item.value} href={item.href} aria-current={item.value===selectedAuditRange?"page":undefined}
          className={"inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border px-3 text-sm font-semibold md:min-h-9 "+
           (item.value===selectedAuditRange?"border-[var(--lms-primary)] bg-[var(--lms-primary)] text-white":"border-border bg-surface text-link hover:bg-primary-subtle")}>{item.label}</Link>)}
        {subjectId?<Link href={basePath+"/audit"+(()=>{
          const params=new URLSearchParams(preservedRefreshQuery);
          params.delete("subjectId");
          return params.size?"?"+params.toString():"";
        })()}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-xs font-semibold text-link hover:bg-primary-subtle md:min-h-9"
          aria-label={"Clear entity filter for "+subjectId}>Filtered to: {subjectId} <span aria-hidden="true">×</span></Link>:null}
      </nav>
      <details className="group min-w-0 border-b border-border pb-4" open={Boolean(eventType || importance || subjectType || subjectId || to)}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-semibold text-primary-text marker:hidden [&::-webkit-details-marker]:hidden md:min-h-9">
          <span>Filters</span><span aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-180">⌄</span>
        </summary>
      <form
        className="grid min-w-0 gap-3 pt-3 md:grid-cols-2 xl:grid-cols-3"
        action={basePath + "/audit"}
      >
        <label>
          <span className="mb-1 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Action
          </span>
          <Select className={inputClass} name="action" defaultValue={eventType??""}>
            <option value="">All actions</option>
            <optgroup label="Legacy actions">
              {legacyOptions.map(([key,value])=><option key={key} value={value}>
                {key.replaceAll("_"," ")}
              </option>)}
            </optgroup>
            <optgroup label="Other project events">
              {(Object.values(ACTIVITY_EVENT_TYPES) as string[]).filter(value=>
                value.startsWith("projects.")&&!legacyOptions.some(([_,mapped])=>mapped===value))
                .sort().map(value=><option key={value} value={value}>
                  {value.replace(/^projects\./,"").replaceAll("."," · ").replaceAll("_"," ")}
                </option>)}
            </optgroup>
          </Select>
        </label>
        <label>
          <span className="mb-1 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Importance
          </span>
          <Select
            className={inputClass}
            name="importance"
            defaultValue={importance ?? ""}
          >
            <option value="">
              All importance
            </option>
            {ACTIVITY_IMPORTANCE.map(
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ),
            )}
          </Select>
        </label>
        <label>
          <span className="mb-1 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Subject
          </span>
          <Input
            className={inputClass}
            name="subjectType"
            defaultValue={subjectType}
            placeholder="project"
          />
        </label>
        <label>
          <span className="mb-1 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Entity ID</span>
          <Input className={inputClass} name="subjectId" defaultValue={subjectId??""}
            placeholder="Exact project or task UUID"/>
        </label>
        <label>
          <span className="mb-1 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            From (IST)
          </span>
          <DateInput mode="date"
            className={inputClass}
            name="from"
            defaultValue={from}
          />
        </label>
        <label>
          <span className="mb-1 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            To (IST)
          </span>
          <DateInput mode="date"
            className={inputClass}
            name="to"
            defaultValue={to}
          />
        </label>
        <div className="flex min-w-0 flex-col gap-2 md:col-span-2 md:flex-row md:items-end xl:col-span-3">
          <Button
            type="submit"
            className="w-full justify-center md:w-auto"
          >
            Apply filters
          </Button>
          <Link
            href={basePath + "/audit"}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
          >
            Reset
          </Link>
        </div>
      </form>
      </details>

      <section aria-label="Audit page summary" className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        {([
          {label:"Actions shown"+(partialCoverage?" (partial)":""),value:coveredEvents},
          {label:"People who made changes"+(partialCoverage?" (partial)":""),value:peopleCount},
          {label:"Destructive actions"+(partialCoverage?" (partial)":""),value:destructiveCount},
        ]).map(item=><div key={item.label} className="p-4">
          <p className="text-xs font-semibold text-muted-foreground leading-[20px]">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{item.value}</p>
        </div>)}
      </section>
      <p role="status" className="text-xs text-body">
        Displaying {coveredEvents} raw audit actions in {groups.length} grouped entries.
        {partialCoverage?" Counts are minimums for this page; older events are available below.":""}
        {allTime?" All-time pages show up to 25 actions.":" Date-filtered views show up to 200 actions."}
      </p>
      <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link href={refreshHref} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Refresh</Link>
          {basePath === "/admin/projects" ? <Link href="/admin/audit" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">View activity log</Link> : null}
        </div>
        <ProjectAuditPageExport rows={result.items.map(item=>({
        id:item.event.id,action:item.event.eventType,
        summary:item.event.summary,entity:item.event.subjectLabel??"",
        importance:item.event.importance,
        entityType:item.event.subjectType,
        entityId:item.event.subjectId,
        actorName:item.actor.displayName??"System",
        occurredAt:item.event.occurredAt.toISOString(),
      }))}/>
      </div>
      <section aria-label="Workspace audit actions" className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Workspace actions</h2>
        <div className="divide-y divide-border">
          {rawEvents.map(item=>{
            const metadata=(item.event.metadata??{}) as Record<string,unknown>;
            const workspaceId=linkedWorkspaceId({
              subjectId:item.event.subjectId,subjectType:item.event.subjectType,
              metadata,
            });
            return <div key={item.event.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="break-words font-semibold">{item.event.subjectLabel??item.event.subjectType}</p>
                <p className="break-words text-xs text-body">
                  {item.event.eventType} · {item.actor.displayName??"System"} · {
                    new Intl.DateTimeFormat("en-IN",{
                      timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
                    }).format(item.event.occurredAt)}
                </p>
              </div>
              {workspaceId?<Link
                href={basePath+"/"+encodeURIComponent(workspaceId)+"/summary?from=audit"}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">
                Open workspace
              </Link>:null}
            </div>;
          })}
        </div>
      </section>
      <ActivityCenter
        emptyActionHref={basePath + "/audit"}
        groups={groups}
        nextRemaining={result.remainingCount}
        nextHref={
          result.nextCursor
            ? basePath +
              "/audit?" +
              nextParams.toString()
            : null
        }
      />

      <p className="text-xs text-muted-foreground leading-[20px]">
        This view reflects persisted vNext Project activity events. Legacy-only audit actions remain tracked as W03 parity work until their producers are implemented against the shared activity taxonomy.
      </p>
    </div>
  );
}
