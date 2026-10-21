import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { AuthorizationError } from "@/modules/permissions/policy";
import { sanitizeActivityMetadata } from "@/modules/activity/metadata-sanitizer";
import { CollegeActivityRefresh } from "@/components/activity/college-activity-refresh";
import { CollegeActivityExportButton } from "@/components/activity/college-activity-export-button";
import { EmptyState } from "@/components/ui/empty-state";
import { activitySearchParams, collegeActivityHref, collegeActivityQuerySchema, collegeActivityRecentHref, collegeActivityTodayHref, collegeActivityAllTimeHref, invalidCollegeActivityCategory } from "@/modules/activity/college-activity-model";
import { listCollegeActivity } from "@/modules/activity/college-activity-service";
import { ACTIVITY_IMPORTANCE, ACTIVITY_MODULES } from "@/modules/activity/taxonomy";
import {collegeActivityActor,collegeActivityItem,collegeActivityAction} from "@/modules/activity/college-activity-presentation";
import {Button} from "@/components/ui/button";

type RawSearch = Record<string, string | string[] | undefined>;

function when(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
  }).format(value);
}
function timeOnly(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour:"numeric", minute:"2-digit", hour12:true, timeZone:"Asia/Kolkata",
  }).format(value).toUpperCase();
}
function istDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    year:"numeric", month:"2-digit", day:"2-digit", timeZone:"Asia/Kolkata",
  }).formatToParts(value);
  const part=(kind:string)=>parts.find(v=>v.type===kind)?.value??"";
  return part("year")+"-"+part("month")+"-"+part("day");
}
function dateHeading(value: Date, now: Date) {
  const today=istDateKey(now);
  const yesterday=istDateKey(new Date(now.getTime()-86400000));
  const target=istDateKey(value);
  if(target===today)return "Today";
  if(target===yesterday)return "Yesterday";
  return new Intl.DateTimeFormat("en-GB",{
    weekday:"long",day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata",
  }).format(value);
}

export default async function CollegeActivityPage({
  searchParams,
}: { searchParams: Promise<RawSearch> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-3"><PageHeader title="Activity Log"/><Alert tone="warning" title="College not assigned">Ask your administrator to assign a college before you can view the activity log.</Alert></div>;
  const raw = await searchParams;
  const parsed = collegeActivityQuerySchema.safeParse({...(activitySearchParams(raw) as Record<string,unknown>),pageSize:raw.pageSize || "50"});
  if (!parsed.success) return <div className="min-w-0 space-y-4">
    <PageHeader title="Activity Log" />
    <ErrorState title="Invalid activity filters"
      description={invalidCollegeActivityCategory(raw.category) ?? "The actor, entity, date range or pagination cursor is invalid. No audit events were loaded."}
      action={<Link href="/college/activity" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Clear filters</Link>} />
  </div>;
  const data = await listCollegeActivity(context, parsed.data).catch((error:unknown)=>{
    if (error instanceof AuthorizationError) throw error;
    return null;
  });
  if (!data) return <div className="min-w-0 space-y-4">
    <PageHeader title="Activity Log" />
    <Alert tone="error" title="Couldn't load activity">The college activity feed could not be refreshed. No audit history was modified.</Alert>
    <ErrorState title="Activity temporarily unavailable"
      description="Retry the same filters to load the latest recorded events."
      action={<a href={collegeActivityHref(parsed.data)} className="font-semibold text-link underline underline-offset-4">Retry activity</a>} />
  </div>;
  const now = new Date();
  const groupedByDay=new Map<string,typeof data.groups>();
  for(const group of data.groups){
    const day=dateHeading(group.latest.event.occurredAt,now);
    const list=groupedByDay.get(day)??[];
    list.push(group);
    groupedByDay.set(day,list);
  }
  const exportParams = new URLSearchParams();
  for (const key of ["view", "category", "module", "importance", "eventType", "q", "actorUserId", "actorName", "subjectType", "subjectId", "from", "to"] as const) {
    const value = data.query[key];
    if (value) exportParams.set(key, value);
  }
  return <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
    <PageHeader title="Activity Log"
      actions={<Link href="/college/projects/audit"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">View project activity</Link>} />
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3" aria-label="Activity controls">
      <nav aria-label="Activity categories" className="flex min-w-0 flex-wrap gap-1 rounded-[var(--lms-control-radius)] bg-[#f0f3f4] p-1">
        {([
          ["IMPORTANT","Important"],["ACADEMIC_SETUP","Academic setup"],
          ["PEOPLE_ACCESS","People & access"],["TEACHING","Teaching"],
          ["PROJECTS","Projects"],["EVERYTHING","Everything"],
        ] as const).map(([key,label])=>{
          const active=key===(data.query.category??(data.query.view==="EVERYTHING"?"EVERYTHING":"IMPORTANT"));
          return <Link key={key} aria-current={active?"page":undefined}
            href={collegeActivityHref({...data.query,category:key==="IMPORTANT"||key==="EVERYTHING"?undefined:key,
              view:key==="EVERYTHING"?"EVERYTHING":"IMPORTANT",module:undefined,importance:undefined})}
            className={"inline-flex min-h-10 items-center justify-center rounded-[var(--lms-control-radius)] px-3 text-sm font-semibold " +
             (active?"bg-white text-[#0b6772] shadow-sm":"text-[var(--lms-body-text)] hover:bg-white/70")}>
            {label}
          </Link>;
        })}
      </nav>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <nav aria-label="Activity date ranges" className="flex flex-wrap gap-1 rounded-[var(--lms-control-radius)] bg-[#f0f3f4] p-1">
          {([
            ["Today",collegeActivityTodayHref(data.query,now)],
            ["7 days",collegeActivityRecentHref(data.query,7,now)],
            ["30 days",collegeActivityRecentHref(data.query,30,now)],
            ["All time",collegeActivityAllTimeHref(data.query)],
          ] as const).map(([label,href])=><Link key={label} href={href}
            aria-current={collegeActivityHref(data.query)===href?"page":undefined}
            className={"inline-flex min-h-10 items-center rounded-[var(--lms-control-radius)] px-3 text-sm font-semibold " +
              (collegeActivityHref(data.query)===href?"bg-white text-[#0b6772] shadow-sm":"text-[var(--lms-body-text)] hover:bg-white/70")}>
            {label}</Link>)}
        </nav>
        <CollegeActivityRefresh />
        <CollegeActivityExportButton href={"/api/activity/college-export"+(exportParams.size?"?"+exportParams.toString():"")}
          disabled={!data.items.length}/>
      </div>
    </div>
    {(data.query.view??"IMPORTANT")==="IMPORTANT"&&!data.query.category?
      <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
        Deletions and restores, promotions, suspensions, impersonation, module access and feature changes, and identity views.
      </p>:null}
    <section className="border-b border-border pb-4" aria-label="Activity log filters">
      <form action="/college/activity" method="get" className="grid min-w-0 gap-[var(--lms-space-2)] md:grid-cols-2 lg:grid-cols-4">
        {data.query.view ? <input type="hidden" name="view" value={data.query.view}/> : null}
        {data.query.category ? <input type="hidden" name="category" value={data.query.category}/> : null}
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Module
          <Select name="module" defaultValue={data.query.module ?? ""}
            className="min-h-11 md:min-h-9">
            <option value="">All modules</option>
            {ACTIVITY_MODULES.map(v =>
              <option key={v} value={v}>{v}</option>)}
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Importance
          <Select name="importance" defaultValue={data.query.importance ?? ""}
            className="min-h-11 md:min-h-9">
            <option value="">All importance levels</option>
            {ACTIVITY_IMPORTANCE.map(v =>
              <option key={v} value={v}>{v}</option>)}
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Event type
          <Input name="eventType" defaultValue={data.query.eventType ?? ""}
            maxLength={120} placeholder="identity.membership.suspended"
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Search audit summary or entity
          <Input name="q" defaultValue={data.query.q ?? ""} maxLength={100}
            placeholder="Summary, entity or action text"
            className="min-h-11 md:min-h-9" />
        </label>
        <details className="min-w-0 md:col-span-2 lg:col-span-4" open={Boolean(data.query.actorUserId || data.query.actorName || data.query.subjectType || data.query.subjectId || data.query.from || data.query.to || (data.query.pageSize && data.query.pageSize !== "50"))}>
          <summary className="flex min-h-11 cursor-pointer items-center text-[var(--lms-font-base)] font-semibold text-[var(--lms-body-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Activity log filters</summary>
          <div className="mt-[var(--lms-space-3)] grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Actor user UUID
          <Input name="actorUserId" defaultValue={data.query.actorUserId ?? ""}
            placeholder="Optional actor UUID"
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Actor display name
          <Input name="actorName" defaultValue={data.query.actorName ?? ""} maxLength={100}
            placeholder="Search recorded actor name"
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Entity type
          <Input name="subjectType" defaultValue={data.query.subjectType ?? ""}
            maxLength={80} placeholder="course_lesson"
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Entity identifier
          <Input name="subjectId" defaultValue={data.query.subjectId ?? ""}
            maxLength={500} placeholder="Persisted entity identifier"
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          From date (IST)
          <DateInput name="from" mode="date" defaultValue={data.query.from ?? ""}
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          To date (IST)
          <DateInput name="to" mode="date" defaultValue={data.query.to ?? ""}
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Events per page
          <Select name="pageSize" defaultValue={data.query.pageSize ?? "50"}
            className="min-h-11 md:min-h-9">
            <option value="10">10 events</option>
            <option value="25">25 events</option>
            <option value="50">50 events</option>
          </Select>
        </label>
          </div>
        </details>
        <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-end md:col-span-2 lg:col-span-4">
          <Button variant="primary" type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">
            Apply filters
          </Button>
          <Link href="/college/activity" className="inline-flex min-h-11 items-center justify-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Clear
          </Link>
        </div>
      </form>
    </section>
    <section className="min-w-0 space-y-5" aria-label="College activity events">
      {data.groups.length===0?<EmptyState title={(data.query.view??"IMPORTANT")==="IMPORTANT"&&!data.query.category
        ? "Nothing important happened in this period." : "No activity in this period."}
        description="Try another category or date range to see recorded changes."
        action={<Link href="/college/activity" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link>} />:null}
      {[...groupedByDay.entries()].map(([day,groups])=>
        <section key={day} className="space-y-3" aria-label={"Activity on "+day}>
          <h3 className="border-b border-[var(--lms-canvas-border)] pb-2 text-[var(--lms-font-base)] font-semibold text-[var(--lms-heading)]">{day}</h3>
          <ol className="divide-y divide-[var(--lms-canvas-border)]">
            {groups.map(group=>{
              const item=group.latest;
              return <li key={item.event.id} className={"grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-3 border-l-[3px] py-3 pl-2 sm:grid-cols-[84px_minmax(0,1fr)] "+
               (/(DELETED|REVOKED|SUSPENDED|REJECTED)/.test(item.event.eventType)?"border-l-rose-500":
                /(RESTORED|APPROVED|CREATED)/.test(item.event.eventType)?"border-l-emerald-500":
                /(CHANGED|UPDATED|PROMOTED)/.test(item.event.eventType)?"border-l-amber-500":"border-l-slate-300")}>
                <time dateTime={item.event.occurredAt.toISOString()} className="pt-1 text-xs tabular-nums text-muted-foreground">{timeOnly(item.event.occurredAt)}</time>
                <div className="min-w-0 space-y-2">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--lms-heading)]">{item.event.summary}</p>
                    <p className="text-[var(--lms-font-sm)] text-[var(--lms-body-text)]">{collegeActivityActor(item.actor)} · {collegeActivityAction(item.event.eventType)}</p>
                    <p className="text-xs text-muted-foreground">{collegeActivityItem(item.event)} · {when(item.event.occurredAt)}</p>
                  </div>
                  {group.count>1?<span className="rounded-md border border-[var(--lms-canvas-border)] px-2 py-1 text-xs font-semibold">{group.count} related events · several at once</span>:null}
                </div>
                <details className="min-w-0 text-sm">
                  <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Details</summary>
                  <dl className="grid min-w-0 gap-2 border-l border-[var(--lms-canvas-border)] pl-3 sm:grid-cols-2">
                    <div><dt className="font-semibold">Actor</dt><dd className="break-words">{collegeActivityActor(item.actor)}</dd></div>
                    <div><dt className="font-semibold">When (IST)</dt><dd>{when(item.event.occurredAt)}</dd></div>
                    <div><dt className="font-semibold">Event</dt><dd className="break-all">{item.event.eventType}</dd></div>
                    <div><dt className="font-semibold">Subject</dt><dd className="break-words">{item.event.subjectType} · {collegeActivityItem(item.event)}</dd></div>
                  </dl>
                  <p className="mt-2 text-xs text-muted-foreground">Sanitized recorded metadata{group.count>1?" (latest event in this group)":""}:</p>
                  <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words border-y border-[var(--lms-canvas-border)] py-2 text-xs">{JSON.stringify(sanitizeActivityMetadata(item.event.metadata),null,2)}</pre>
                  <Link href={"/college/activity/"+encodeURIComponent(item.event.id)}
                    className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">View full event</Link>
                </details>
                </div>
              </li>;
            })}
          </ol>
        </section>)}
      <p className="text-xs text-muted-foreground">Showing {data.items.length} recorded events in {data.groups.length} chronological groups on this page. Grouped counts never imply missing history was retrieved.</p>
    </section>
    <nav aria-label="Activity history pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">Up to {data.query.pageSize ?? "50"} events per page</p>
      {data.nextCursor ? <Link href={collegeActivityHref(data.query, data.nextCursor)}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Load more older activity
      </Link> : <span className="text-muted-foreground">No older matching events</span>}
    </nav>
    <p className="text-xs text-muted-foreground">
      Important shows high- and critical-importance events. Category views remain college-scoped; Everything includes all importance levels.
    </p>
    <p className="text-xs text-muted-foreground">
      The export uses severity, module, action, actor, entity type, entity identifier and IST date filters from the newest event,
      with a 1,000-row cap and an explicit CSV footer if truncated.
    </p>
    <p className="text-xs text-muted-foreground">
      Audit results are immutable persisted events. Detail metadata is sanitized before display.
      Search filters are scoped to the signed-in College Admin; this page has no write actions.
    </p>
  </div>;
}
