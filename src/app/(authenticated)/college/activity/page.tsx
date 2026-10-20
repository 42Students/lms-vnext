import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { activitySearchParams, collegeActivityHref, collegeActivityQuerySchema, collegeActivityRecentHref, collegeActivityTodayHref, collegeActivityAllTimeHref } from "@/modules/activity/college-activity-model";
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
  if (!context.membership) return <div className="space-y-3"><PageHeader title="Activity Log"/><Alert tone="error">Admin not assigned to a college. Ask a Super Admin to assign a college before you can view the audit trail.</Alert></div>;
  const parsed = collegeActivityQuerySchema.safeParse(
    activitySearchParams(await searchParams),
  );
  if (!parsed.success) return <div className="space-y-4">
    <PageHeader title="Activity Log" />
    <ErrorState title="Invalid activity filters"
      description="The actor, entity, date range or pagination cursor is invalid. No audit events were loaded."
      action={<Link href="/college/activity" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Clear filters</Link>} />
  </div>;
  const data = await listCollegeActivity(context, parsed.data);
  const exportParams = new URLSearchParams();
  for (const key of ["view", "category", "module", "importance", "eventType", "q", "actorUserId", "actorName", "subjectType", "subjectId", "from", "to"] as const) {
    const value = data.query[key];
    if (value) exportParams.set(key, value);
  }
  return <div className="min-w-0 overflow-x-clip space-y-6">
    <PageHeader title="Activity Log"
      description="What changed across your college. Important items first, with focused categories and the complete immutable audit trail."
      actions={<div className="flex flex-wrap gap-3 items-center"><Link href="/college/projects/audit" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">View project activity</Link><a href={"/api/activity/college-export" +
        (exportParams.size ? "?" + exportParams.toString() : "")}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">
        Export filtered CSV (max 1,000)
      </a></div>} />
    <nav aria-label="Activity feed categories" className="flex flex-wrap gap-2">
      {([
        ["IMPORTANT", "Important"], ["ACADEMIC_SETUP", "Academic setup"],
        ["PEOPLE_ACCESS", "People & access"], ["TEACHING", "Teaching"],
        ["PROJECTS", "Projects"], ["EVERYTHING", "Everything"],
      ] as const).map(([key, label]) => {
        const category = key==="IMPORTANT"||key==="EVERYTHING" ? undefined : key;
        const view = key==="EVERYTHING" ? "EVERYTHING" : "IMPORTANT";
        const active = key==="EVERYTHING"
          ? data.query.view==="EVERYTHING" && !data.query.category
          : key==="IMPORTANT" ? !data.query.category && data.query.view!=="EVERYTHING"
          : data.query.category===category;
        return <Link key={key} aria-current={active?"page":undefined}
          href={collegeActivityHref({...data.query,category,view,module:undefined,importance:undefined})}
          className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 " +
            (active ? "border-primary bg-primary-subtle text-link" : "border-border text-body")}>
          {label}
        </Link>;
      })}
    </nav>
    <p className="text-xs text-muted-foreground">
      Important shows high- and critical-importance events. Category views remain college-scoped; Everything includes all importance levels.
    </p>
    <p className="text-xs text-muted-foreground">
      The export uses severity, module, action, actor, entity type, entity identifier and IST date filters from the newest event,
      with a 1,000-row cap and an explicit CSV footer if truncated.
    </p>
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="text-muted-foreground">IST date shortcuts:</span>
      <Link href={collegeActivityTodayHref(data.query,new Date())}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Today</Link>
      <Link href={collegeActivityRecentHref(data.query,7,new Date())}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Last 7 days</Link>
      <Link href={collegeActivityRecentHref(data.query,30,new Date())}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Last 30 days</Link>
      <Link href={collegeActivityAllTimeHref(data.query)}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">All time</Link>
      <Link href={collegeActivityHref({...data.query})}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Refresh</Link>
    </div>
    <section className="border-t border-border pt-4" aria-label="Activity log filters">
      <form action="/college/activity" method="get" className="grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-sm font-semibold text-body">
          Module
          <Select name="module" defaultValue={data.query.module ?? ""}
            className="min-h-11 md:min-h-9">
            <option value="">All modules</option>
            {ACTIVITY_MODULES.map(v =>
              <option key={v} value={v}>{v}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Importance
          <Select name="importance" defaultValue={data.query.importance ?? ""}
            className="min-h-11 md:min-h-9">
            <option value="">All importance levels</option>
            {ACTIVITY_IMPORTANCE.map(v =>
              <option key={v} value={v}>{v}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Event type
          <Input name="eventType" defaultValue={data.query.eventType ?? ""}
            maxLength={120} placeholder="identity.membership.suspended"
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Search audit summary or entity
          <Input name="q" defaultValue={data.query.q ?? ""} maxLength={100}
            placeholder="Summary, entity or action text"
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Actor user UUID
          <Input name="actorUserId" defaultValue={data.query.actorUserId ?? ""}
            placeholder="Optional actor UUID"
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Actor display name
          <Input name="actorName" defaultValue={data.query.actorName ?? ""} maxLength={100}
            placeholder="Search recorded actor name"
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Entity type
          <Input name="subjectType" defaultValue={data.query.subjectType ?? ""}
            maxLength={80} placeholder="course_lesson"
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Entity identifier
          <Input name="subjectId" defaultValue={data.query.subjectId ?? ""}
            maxLength={500} placeholder="Persisted entity identifier"
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          From date (IST)
          <DateInput name="from" mode="date" defaultValue={data.query.from ?? ""}
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          To date (IST)
          <DateInput name="to" mode="date" defaultValue={data.query.to ?? ""}
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Events per page
          <Select name="pageSize" defaultValue={data.query.pageSize ?? "25"}
            className="min-h-11 md:min-h-9">
            <option value="10">10 events</option>
            <option value="25">25 events</option>
            <option value="50">50 events</option>
          </Select>
        </label>
        <div className="flex flex-wrap items-end gap-2 md:col-span-2 lg:col-span-4">
          <Button variant="primary" type="submit" className="min-h-11 md:min-h-9">
            Apply filters
          </Button>
          <Link href="/college/activity" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">
            Clear
          </Link>
        </div>
      </form>
    </section>
    <section className="min-w-0" aria-label="College activity events">
      <DataTable rows={data.items} getRowKey={item=>item.event.id} caption="College activity events"
        columns={[
          {key:"occurred",header:"Occurred (IST)",mobilePriority:"secondary",cell:item=>when(item.event.occurredAt)},
          {key:"actor",header:"Actor",mobilePriority:"primary",cell:item=>collegeActivityActor(item.actor)},
          {key:"event",header:"Event / entity",mobilePriority:"secondary",cell:item=><>
            <p className="font-semibold text-foreground">{item.event.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">{collegeActivityAction(item.event.eventType)} · {item.event.subjectType}</p>
            <p className="mt-1 text-xs text-muted-foreground">{collegeActivityItem(item.event)}</p>
          </>},
          {key:"details",header:"Details",mobilePriority:"action",cell:item=>
            <Link href={"/college/activity/" + encodeURIComponent(item.event.id)}
              className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">View event</Link>},
        ]}
        empty={<EmptyState title="No matching activity" description="No persisted activity events match these filters. This is not a statement that no changes have ever occurred."/>}/>
    </section>
    <nav aria-label="Activity history pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">Up to {data.query.pageSize ?? "25"} events per page</p>
      {data.nextCursor ? <Link href={collegeActivityHref(data.query, data.nextCursor)}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">
        Older activity
      </Link> : <span className="text-muted-foreground">No older matching events</span>}
    </nav>
    <p className="text-xs text-muted-foreground">
      Audit results are immutable persisted events. Detail metadata is sanitized before display.
      Search filters are scoped to the signed-in College Admin; this page has no write actions.
    </p>
  </div>;
}
