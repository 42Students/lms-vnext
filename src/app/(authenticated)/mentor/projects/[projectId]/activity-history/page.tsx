import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  mentorProjectActivityHref,mentorProjectActivityQuerySchema,
  mentorProjectActivityMobileLayout,mentorProjectActivityMobileFilters,
} from "@/modules/projects/mentor-project-activity-model";
import { getMentorProjectActivityHistory } from "@/modules/projects/mentor-project-activity-service";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";

type Params={importance?:string|string[];view?:string|string[];window?:string|string[];order?:string|string[];page?:string|string[];pageSize?:string|string[]};

export default async function MentorProjectActivityHistoryPage({
  params,searchParams,
}:{params:Promise<{projectId:string}>;searchParams:Promise<Params>}) {
  const [{projectId},raw]=await Promise.all([params,searchParams]);
  const filters=singleValueMentorFilters({
    importance:raw.importance,view:raw.view,window:raw.window,order:raw.order,page:raw.page,pageSize:raw.pageSize,
  });
  const parsed=mentorProjectActivityQuerySchema.safeParse(
    filters ? {projectId,...filters} : null,
  );
  if(!parsed.success)return <section role="alert" className="space-y-3">
    <h1 className="font-semibold text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Invalid activity filters</h1>
    <Link href="/mentor/projects" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      Return to projects
    </Link>
  </section>;
  const context=await getCurrentRequestContext();
  const data=await getMentorProjectActivityHistory(context,parsed.data);
  return <div className={mentorProjectActivityMobileLayout}>
    <PageHeader eyebrow="Mentor · Project Activity" title="Recorded project activity"
      description={data.enabled?data.title+" · Events linked to this assigned project.":"Projects access is disabled. No private project activity was loaded."}
      actions={<Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=activity"}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Project activity workspace
      </Link>} />
    {!data.enabled ?
      <section role="status" className="border-b border-border pb-4 text-sm text-body">
        Projects access is disabled. No project activity was loaded.
      </section> : <>
      <form method="get"
        action={"/mentor/projects/"+encodeURIComponent(projectId)+"/activity-history"}
        className={mentorProjectActivityMobileFilters}>
        <label className="grid gap-1 text-sm font-semibold text-body">Event importance
          <Select name="importance" defaultValue={data.query.importance}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-foreground">
            <option value="ALL">All</option><option value="LOW">Low</option>
            <option value="NORMAL">Normal</option><option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Event type
          <Select name="view" defaultValue={data.query.view}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All recorded events</option>
            <option value="PROJECT">Project lifecycle</option>
            <option value="REVIEWS">Review decisions</option><option value="DELIVERIES">Final delivery history</option>
            <option value="MEETINGS">Meeting decisions</option>
            <option value="TASKS">Task events</option>
            <option value="EVALUATIONS">Recorded evaluations</option><option value="SPRINTS">Sprint changes</option><option value="ASSIGNMENTS">Mentor assignments</option><option value="RESOURCES">Resources</option><option value="TEAM">Team membership</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Recorded within
          <Select name="window" defaultValue={data.query.window}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All recorded events</option>
            <option value="LAST_7_DAYS">Past 7×24 hours</option>
            <option value="LAST_30_DAYS">Past 30×24 hours</option>
            <option value="LAST_90_DAYS">Past 90×24 hours</option>
            <option value="OLDER_THAN_30_DAYS">Older than 30×24 hours</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Chronology
          <Select name="order" defaultValue={data.query.order}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-foreground">
            <option value="NEWEST">Newest recorded first</option>
            <option value="OLDEST">Oldest recorded first</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Rows per page
          <Select name="pageSize" defaultValue={String(data.query.pageSize)}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-foreground">
            <option value="20">20 events</option>
            <option value="50">50 events</option>
          </Select>
        </label>
        <Button type="submit" variant="primary">
          Filter
        </Button>
        <Link href={mentorProjectActivityHref({...data.query,importance:"ALL",view:"ALL",window:"ALL",order:"NEWEST",pageSize:20,page:1})}
          className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear</Link>
      </form>
      <p className="text-sm text-body">
        {data.total} matching persisted event{data.total===1?"":"s"}
      </p>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={"/api/projects/"+encodeURIComponent(projectId)+
          "/mentor-activity-export"+(data.query.importance==="ALL"&&data.query.view==="ALL"&&data.query.window==="ALL"&&data.query.order==="NEWEST"?"":"?"+
            new URLSearchParams({importance:data.query.importance,view:data.query.view,window:data.query.window,order:data.query.order}).toString())}
          download className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Export recorded events CSV (max 200)
        </Link>
        {data.total>200?<span role="status">
          Export omits {data.total-200} additional matching events.
        </span>:null}
      </div>
      {data.items.length===0 ? <EmptyState title="No recorded project activity"
        description="No registered activity events match this project and importance filter. Missing audit producers or pre-migration records cannot be inferred." />
        : <ol className="divide-y divide-border">{data.items.map(event=>
          <li key={event.id} className="min-w-0 break-words py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{event.label}</p>
              <span className="text-xs text-body">{event.importance}</span>
            </div>
            <time dateTime={event.occurredAt.toISOString()} className="mt-2 block text-xs text-muted-foreground">
              {new Intl.DateTimeFormat("en-IN",{
                dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
              }).format(event.occurredAt)} IST
            </time>
          </li>)}</ol>}
      <nav aria-label="Project activity history pages" className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</p>
        <div className="flex gap-3">
          {data.page>1 && <Link href={mentorProjectActivityHref({...data.query,page:data.page-1})}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Previous</Link>}
          {data.page<data.totalPages && <Link href={mentorProjectActivityHref({...data.query,page:data.page+1})}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next</Link>}
        </div>
      </nav>
    </>}
    <p className="text-xs leading-5 text-muted-foreground">
      This safe timeline shows only registered event types and timestamps;
      raw summaries, metadata, actor identities and private project details are withheld.
      It does not claim to contain every historic action.
    </p>
  </div>;
}
