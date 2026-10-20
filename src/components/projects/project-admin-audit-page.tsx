import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ActivityCenter,
  type ActivityCenterGroup,
} from "@/components/activity/activity-center";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import {ProjectAuditPageExport} from "@/components/projects/project-audit-page-export";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { Banner } from "@/components/ui/banner";
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
    <div className="space-y-6">
      <PageHeader
        title="Project audit"
        description={globalTemplateAudit?"Platform-wide Projects activity includes global template changes.":"Who changed what, and when — check daily for anything unexpected."}
        actions={<div className="flex flex-wrap items-center justify-end gap-2">
          <a href={basePath + "/audit"} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-[768px]:min-h-9">Refresh</a>
          {basePath === "/admin/projects" ? <a href="/admin/audit" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-[768px]:min-h-9">View activity log</a> : null}
        </div>}
      />
      <ProjectAdminNav basePath={basePath} active="audit" />

      {filters.ignoredInvalidFilters ? (
        <Banner tone="warning" role="alert">
          Some audit filters were invalid and have been ignored. Review the filters below and apply them again.
        </Banner>
      ) : null}

      <Tabs ariaLabel="Audit time range" renderPanel={false} value={selectedAuditRange} items={auditRangeTabs} />
      <form
        className="grid min-w-0 gap-3 border-b border-border pb-5 md:grid-cols-2 min-[1366px]:grid-cols-5"
        action={basePath + "/audit"}
      >
        <label>
          <span className="mb-1 block text-[13px] font-semibold text-body">
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
          <span className="mb-1 block text-[13px] font-semibold text-body">
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
          <span className="mb-1 block text-[13px] font-semibold text-body">
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
          <span className="mb-1 block text-[13px] font-semibold text-body">Entity ID</span>
          <Input className={inputClass} name="subjectId" defaultValue={subjectId??""}
            placeholder="Exact project or task UUID"/>
        </label>
        <label>
          <span className="mb-1 block text-[13px] font-semibold text-body">
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
          <span className="mb-1 block text-[13px] font-semibold text-body">
            To (IST)
          </span>
          <Input
            className={inputClass}
            name="to"
            type="date"
            defaultValue={to}
          />
        </label>
        <div className="flex flex-wrap items-end gap-2 md:col-span-2 min-[1366px]:col-span-5">
          <Button
            type="submit"
            className="justify-center"
          >
            Apply filters
          </Button>
          <a
            href={basePath + "/audit"}
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-[768px]:min-h-9"
          >
            Reset
          </a>
        </div>
      </form>

      <section aria-label="Audit page summary" className="grid min-w-0 divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0">
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
