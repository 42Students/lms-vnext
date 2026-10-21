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
import { parseProjectAdminAuditQuery } from "@/modules/projects/admin-audit-query-model";
import { mayReadGlobalProjectAudit } from "@/modules/projects/admin-audit-access-model";


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

  const filters = parseProjectAdminAuditQuery(searchParams);
  const { eventType, importance, subjectType, subjectId, from, to } = filters;

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
        limit: 40,
      },
    ).then(value => ({ ok: true as const, value }))
     .catch(() => ({ ok: false as const }));
  if (!activityRead.ok) return <div className="min-w-0 space-y-6">
    <PageHeader title="Project audit"
      description="Who changed what, and when — check daily for anything unexpected."
      actions={<PageBackLink href={basePath} label="Project workspaces" />} />
    <ProjectAdminNav basePath={basePath} active="audit" />
    <ErrorState title="Project audit unavailable"
      description="Could not load project audit events. Your filters have not changed."
      action={<Link href={basePath+"/audit"} className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Retry audit</Link>} />
  </div>;
  const result = activityRead.value;

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
          <span className="mb-1 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Action</span>
          <ProjectAuditActionSelect basePath={basePath} query={preservedRefreshQuery}
            selected={eventType??""} options={(Object.values(ACTIVITY_EVENT_TYPES) as string[])
              .filter(value=>value.startsWith("projects.") &&
                (globalTemplateAudit||!/^(projects\.(template|blueprint|version|platform))/i.test(value)))
              .sort().map(value=>({value,label:projectActionLabel(value)}))}/>
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
          {label:"Actions shown",value:result.groups.reduce((sum,g)=>sum+g.count,0)},
          {label:"People who made changes",value:new Set(result.groups.map(g=>g.latest.actor?.id)
            .filter((id):id is string=>Boolean(id))).size},
          {label:"Destructive actions",value:result.groups.filter(g=>
            /archive|delete|revoke|remove|unassign/i.test(g.latest.event.eventType))
            .reduce((sum,g)=>sum+g.count,0)},
        ]).map(item=><div key={item.label} className="rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
          <p className="text-xs font-semibold text-muted-foreground leading-[20px]">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{item.value}</p>
        </div>)}
      </section>
      <section aria-label="Change log" className="min-w-0 space-y-4 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[var(--lms-heading)]">Change log</h2>
          <ProjectAuditPageExport rows={result.items.map(item=>({
            id:item.event.id,action:item.event.eventType,summary:item.event.summary,
            entity:item.event.subjectLabel??"",entityType:item.event.subjectType,
            entityId:item.event.subjectId,actorName:item.actor?.displayName??null,
            importance:item.event.importance,occurredAt:item.event.occurredAt.toISOString(),
          }))}/>
        </div>
        {!result.items.length?<div role="status" className="rounded-[var(--lms-control-radius)] border border-border px-4 py-6 text-center text-sm text-body">
          No audit events match these filters.
        </div>:<div role="region" aria-label="Project audit events table" tabIndex={0}
          className="min-w-0 overflow-x-auto rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <caption className="sr-only">Project audit changes, actor and entity; scroll horizontally to see all columns</caption>
            <thead className="bg-[var(--lms-neutral-50)] text-xs text-muted-foreground">
              <tr>{["Action","Entity","Actor","When","Details"].map(name=>
                <th scope="col" key={name} className="border-b border-border px-3 py-3 font-semibold">{name}</th>)}</tr>
            </thead>
            <tbody>
              {result.items.map((item,index)=>{
                const event=item.event;
                const destructive=destructiveProjectAction(event.eventType);
                const isWorkspace=/^(project|project_instance|workspace)$/i.test(event.subjectType);
                const workspaceId=isWorkspace&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.subjectId)?event.subjectId:null;
                const entityType=auditEntityType(event.subjectType);
                const when=event.occurredAt;
                const previous=index>0?result.items[index-1]?.event.occurredAt:null;
                const showDay=selectedAuditRange!=="today"&&
                  (index===0||!previous||projectEventDayKey(previous)!==projectEventDayKey(when));
                const subjectFilter=new URLSearchParams(preservedRefreshQuery);
                subjectFilter.set("subjectType",event.subjectType);
                subjectFilter.set("subjectId",event.subjectId);
                const actor=item.actor;
                const role=(actor as {role?:string}|null)?.role;
                const metadata=(event as {metadata?:Record<string,unknown>}).metadata??{};
                return <Fragment key={event.id}>
                  {showDay?<tr><th colSpan={5} scope="colgroup"
                    className="bg-[var(--lms-neutral-50)] px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                    {projectEventDay(when)}
                  </th></tr>:null}
                  <tr className="border-b border-border align-top hover:bg-[var(--lms-neutral-50)]">
                        <td className="w-[22%] break-words px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            <StatusBadge tone={destructive?"error":"neutral"}>{projectActionLabel(event.eventType)}</StatusBadge>
                            {destructive?<span role="img" aria-label="Irreversible or access-changing action"
                              title={"Irreversible or access-changing action: "+event.eventType}>⚠</span>:null}
                          </div>
                          <span title={event.eventType} className="mt-1 block text-xs text-muted-foreground">{event.eventType}</span>
                        </td>
                        <td className="w-[24%] break-words px-3 py-3">
                          <span className="block text-xs font-semibold text-muted-foreground">{entityType}</span>
                          <Link href={basePath+"/audit?"+subjectFilter.toString()}
                            aria-label={"Filter audit log to "+entityType+" "+(event.subjectLabel||event.subjectId)}
                            className="inline-flex min-h-9 max-w-full break-all items-center font-semibold text-link underline md:min-h-9">
                            {event.subjectLabel?.trim()||event.subjectId.slice(0,12)}
                          </Link>
                          {workspaceId?<Link href={basePath+"/"+encodeURIComponent(workspaceId)+"/summary?from=audit"}
                            className="mt-1 block text-xs font-semibold text-link underline">Open workspace</Link>:null}
                        </td>
                        <td className="w-[18%] break-words px-3 py-3">
                          <span className="block font-medium">{actor?.displayName?.trim()||actor?.email?.trim()||(actor?.id?"User #"+actor.id.slice(0,8):"System")}</span>
                          <span className="text-xs text-muted-foreground">{role?role.replaceAll("_"," "):"—"}</span>
                        </td>
                        <td className="w-[20%] whitespace-nowrap px-3 py-3">
                          <time dateTime={when.toISOString()}>{projectEventTime(when)}</time>
                        </td>
                        <td className="w-[16%] px-3 py-3">
                          <details><summary className="min-h-9 cursor-pointer font-semibold text-link">Details</summary>
                            <div className="mt-2 min-w-[220px] max-w-sm space-y-2 rounded border border-border bg-surface p-3">
                              <p className="whitespace-pre-wrap break-words">{event.summary}</p>
                              <p className="text-xs font-semibold text-muted-foreground">Event ID</p>
                              <p className="break-all text-xs">{event.id}</p>
                              {auditDetailValue(metadata)}
                              <Link href={"/activity/"+event.id} className="inline-flex min-h-9 items-center text-xs font-semibold text-link underline">View full event</Link>
                            </div>
                          </details>
                        </td>
                  </tr>
                </Fragment>;
              })}
            </tbody>
          </table>
        </div>}
        {result.nextCursor?<div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
          <span role="status" className="text-muted-foreground">
            Showing {result.items.length} events; {result.remainingCount} older events remain. Summary counts cover the loaded records.
          </span>
          <Link href={basePath+"/audit?"+nextParams.toString()}
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 font-semibold text-link underline md:min-h-9">
            Load more ({result.remainingCount} older)
          </Link>
        </div>:null}
      </section>
      <p className="text-xs text-muted-foreground leading-[20px]">
        This view reflects persisted vNext Project activity events. Legacy-only audit actions remain tracked as W03 parity work until their producers are implemented against the shared activity taxonomy.
      </p>
    </div>
  );
}
