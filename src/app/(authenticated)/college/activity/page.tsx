import { DateInput } from "@/components/ui/date-input";
import { Tabs } from "@/components/ui/tabs";
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

export default async function CollegeActivityPage({
  searchParams,
}: { searchParams: Promise<RawSearch> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-3"><PageHeader title="Activity Log"/><ErrorState title="College activity access unavailable" description="Admin not assigned to a college. Ask a Super Admin to assign a college before you can view the audit trail."/></div>;
  const raw = await searchParams;
  const parsed = collegeActivityQuerySchema.safeParse(activitySearchParams(raw));
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
  const dayFormat=new Intl.DateTimeFormat("en-IN",{dateStyle:"full",timeZone:"Asia/Kolkata"});
  const groupedByDay=new Map<string,typeof data.groups>();
  for(const group of data.groups){
    const day=dayFormat.format(group.latest.event.occurredAt);
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
      description="What changed across your college. Important items first, with focused categories and the complete immutable audit trail."
      actions={<div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]"><Link href="/college/projects/audit" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">View project activity</Link><a href={"/api/activity/college-export" +
        (exportParams.size ? "?" + exportParams.toString() : "")}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Export filtered CSV (max 1,000)
      </a></div>} />
    <Tabs ariaLabel="Activity feed categories" renderPanel={false}
      value={data.query.category ?? (data.query.view==="EVERYTHING"?"EVERYTHING":"IMPORTANT")}
      items={([
        ["IMPORTANT","Important"],["ACADEMIC_SETUP","Academic setup"],
        ["PEOPLE_ACCESS","People & access"],["TEACHING","Teaching"],
        ["PROJECTS","Projects"],["EVERYTHING","Everything"],
      ] as const).map(([key,label])=>({
        value:key,label,
        href:collegeActivityHref({...data.query,
          category:key==="IMPORTANT"||key==="EVERYTHING"?undefined:key,
          view:key==="EVERYTHING"?"EVERYTHING":"IMPORTANT",
          module:undefined,importance:undefined}),
      }))}/>

    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="text-muted-foreground">IST date shortcuts:</span>
      <Link href={collegeActivityTodayHref(data.query,new Date())}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Today</Link>
      <Link href={collegeActivityRecentHref(data.query,7,new Date())}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Last 7 days</Link>
      <Link href={collegeActivityRecentHref(data.query,30,new Date())}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Last 30 days</Link>
      <Link href={collegeActivityAllTimeHref(data.query)}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">All time</Link>
      <CollegeActivityRefresh />
    </div>
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
        <details className="min-w-0 md:col-span-2 lg:col-span-4" open={Boolean(data.query.actorUserId || data.query.actorName || data.query.subjectType || data.query.subjectId || data.query.from || data.query.to || (data.query.pageSize && data.query.pageSize !== "25"))}>
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
          <Select name="pageSize" defaultValue={data.query.pageSize ?? "25"}
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
      {data.groups.length===0?<EmptyState title="No matching activity"
        description="No persisted activity events match these filters. This is not a statement that no changes have ever occurred."
        action={<Link href="/college/activity" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link>} />:null}
      {[...groupedByDay.entries()].map(([day,groups])=>
        <section key={day} className="space-y-3" aria-label={"Activity on "+day}>
          <h2 className="border-b border-[var(--lms-canvas-border)] pb-2 text-[var(--lms-font-base)] font-semibold text-[var(--lms-heading)]">{day}</h2>
          <ol className="divide-y divide-[var(--lms-canvas-border)]">
            {groups.map(group=>{
              const item=group.latest;
              return <li key={item.event.id} className="space-y-2 py-3">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--lms-heading)]">{item.event.summary}</p>
                    <p className="text-[var(--lms-font-sm)] text-[var(--lms-body-text)]">{collegeActivityActor(item.actor)} · {collegeActivityAction(item.event.eventType)}</p>
                    <p className="text-xs text-muted-foreground">{collegeActivityItem(item.event)} · {when(item.event.occurredAt)}</p>
                  </div>
                  {group.count>1?<span className="rounded-md border border-[var(--lms-canvas-border)] px-2 py-1 text-xs font-semibold">{group.count} related events</span>:null}
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
              </li>;
            })}
          </ol>
        </section>)}
      <p className="text-xs text-muted-foreground">Showing {data.items.length} recorded events in {data.groups.length} chronological groups on this page. Grouped counts never imply missing history was retrieved.</p>
    </section>
    <nav aria-label="Activity history pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">Up to {data.query.pageSize ?? "25"} events per page</p>
      {data.nextCursor ? <Link href={collegeActivityHref(data.query, data.nextCursor)}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Older activity
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
