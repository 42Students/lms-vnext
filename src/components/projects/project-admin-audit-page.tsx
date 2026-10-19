import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ActivityCenter,
  type ActivityCenterGroup,
} from "@/components/activity/activity-center";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import {ProjectAuditPageExport} from "@/components/projects/project-audit-page-export";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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

  const result =
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
    );

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
            group.latest.event.importance,
          subjectType:
            group.latest.event.subjectType,
          subjectId:
            group.latest.event.subjectId,
          subjectLabel:
            group.latest.event.subjectLabel,
          summary:
            group.latest.event.summary,
          metadata:(group.latest.event as {metadata?:Record<string,unknown>}).metadata??{},
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
    <div className="space-y-6">
      <ProjectAdminNav
        basePath={basePath}
        active="audit"
      />
      <PageHeader
        eyebrow="Projects"
        title="Project audit"
        description={globalTemplateAudit?"Platform-wide Projects activity includes global template changes.":"Who changed what, and when — check daily for anything unexpected."}
        actions={<div className="flex flex-wrap items-center justify-end gap-2">
          <a href={basePath + "/audit"} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">Refresh</a>
          {basePath === "/admin/projects" ? <a href="/admin/audit" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">View activity log</a> : null}
        </div>}
      />

      {filters.ignoredInvalidFilters ? (
        <p role="alert" className="border-l-2 border-warning-border bg-warning-subtle px-3 py-2 text-sm leading-5 text-body">
          Some audit filters were invalid and have been ignored. Review the filters below and apply them again.
        </p>
      ) : null}

      <nav aria-label="Audit time range" className="flex flex-wrap gap-2 text-sm">
        {([{label:"Today",days:0},{label:"7 days",days:6},
           {label:"30 days",days:29},{label:"All time",days:null}]).map(item=>{
          const params=new URLSearchParams();
          if(eventType)params.set("action",eventType);
          if(importance)params.set("importance",importance);
          if(subjectType)params.set("subjectType",subjectType);
          if(subjectId)params.set("subjectId",subjectId);
          if(item.days!==null)params.set("from",istDate(new Date(currentTimeMs()-item.days*86400000)));
          return <a key={item.label} href={basePath+"/audit?"+params.toString()}
           className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border px-3 text-sm font-semibold text-primary-text">
             {item.label}</a>;
        })}
      </nav>
      <form
        className="grid gap-3 border-b border-border pb-5 sm:grid-cols-2 xl:grid-cols-5"
        action={basePath + "/audit"}
      >
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            Action
          </span>
          <Select className={inputClass} name="action" defaultValue={eventType??""}>
            <option value="">All actions</option>
            {(Object.values(ACTIVITY_EVENT_TYPES) as string[]).filter(value=>
              value.startsWith("projects."))
              .sort().map(value=><option key={value} value={value}>
                {value.replace(/^projects\./,"").replaceAll("."," · ").replaceAll("_"," ")}
              </option>)}
          </Select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
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
          <span className="mb-1 block text-xs font-semibold text-body">
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
          <span className="mb-1 block text-xs font-semibold text-body">Entity ID</span>
          <Input className={inputClass} name="subjectId" defaultValue={subjectId??""}
            placeholder="Exact project or task UUID"/>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            From (IST)
          </span>
          <Input
            className={inputClass}
            name="from"
            type="date"
            defaultValue={from}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            To (IST)
          </span>
          <Input
            className={inputClass}
            name="to"
            type="date"
            defaultValue={to}
          />
        </label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 xl:col-span-5">
          <Button
            type="submit"
            className="justify-center"
          >
            Apply filters
          </Button>
          <a
            href={basePath + "/audit"}
            className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border px-3 text-sm font-semibold text-primary-text"
          >
            Reset
          </a>
        </div>
      </form>

      <section aria-label="Audit page summary" className="grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {([
          {label:"Actions shown",value:result.groups.reduce((sum,g)=>sum+g.count,0)},
          {label:"People who made changes",value:new Set(result.groups.map(g=>g.latest.actor?.id)
            .filter((id):id is string=>Boolean(id))).size},
          {label:"Destructive actions",value:result.groups.filter(g=>
            /archive|delete|revoke|remove|unassign/i.test(g.latest.event.eventType))
            .reduce((sum,g)=>sum+g.count,0)},
        ]).map(item=><div key={item.label} className="p-4">
          <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{item.value}</p>
        </div>)}
      </section>
      <ProjectAuditPageExport rows={result.items.map(item=>({
        id:item.event.id,action:item.event.eventType,
        summary:item.event.summary,entity:item.event.subjectLabel??"",
        importance:item.event.importance,
        occurredAt:item.event.occurredAt.toISOString(),
      }))}/>
      <ActivityCenter
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

      <p className="text-xs leading-5 text-muted-foreground">
        This view reflects persisted vNext Project activity events. Legacy-only audit actions remain tracked as W03 parity work until their producers are implemented against the shared activity taxonomy.
      </p>
    </div>
  );
}
