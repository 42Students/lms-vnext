import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  mentorTaskHistoryHref, mentorTaskHistoryQuerySchema, taskReviewDecisionLabel,
} from "@/modules/projects/mentor-task-history-model";
import { getMentorTaskReviewHistory } from "@/modules/projects/mentor-task-history-service";

type Params={decision?:string|string[];priority?:string|string[];order?:string|string[];search?:string|string[];page?:string|string[]};
const first=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v;
export default async function MentorTaskReviewHistoryPage({
  searchParams,
}:{searchParams:Promise<Params>}) {
  const raw=await searchParams;
  const parsed=mentorTaskHistoryQuerySchema.safeParse(Object.values(raw).some(Array.isArray)?null:{
    decision:first(raw.decision)??undefined,
    priority:first(raw.priority)??undefined,
    order:first(raw.order)??undefined,
    search:first(raw.search)??undefined,
    page:first(raw.page)??undefined,
  });
  if(!parsed.success) return <section role="alert" className="space-y-3">
    <PageHeader title="Invalid review history filters" />
    <Link href="/mentor/task-review-history" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear filters</Link>
  </section>;
  const context=await getCurrentRequestContext();
  if(!hasMembershipRole(context,"MENTOR")) redirect("/dashboard");
  const data=await getMentorTaskReviewHistory(context,parsed.data);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Mentor · Task Board" title="Reviewed task submissions"
      description="Registered task decisions on projects currently assigned to you."
      actions={<Link href="/mentor/task-reviews"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Pending task reviews
      </Link>} />
    {!data.enabled ? <section role="status"
      className="border-b border-border pb-4 text-sm text-body">
      Projects access is disabled. Reviewed task history is unavailable.
    </section> : <>
      <form action="/mentor/task-review-history" method="get"
        className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
        <label className="grid gap-1 text-sm font-semibold text-body">Task or project
          <Input type="search" name="search" defaultValue={data.query.search} maxLength={120}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Decision
          <Select name="decision" defaultValue={data.query.decision}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-foreground">
            <option value="ALL">All reviews</option>
            <option value="APPROVED">Approved</option>
            <option value="CHANGES_REQUESTED">Changes requested</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Task priority
          <Select name="priority" defaultValue={data.query.priority}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All priorities</option><option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option><option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Review chronology
          <Select name="order" defaultValue={data.query.order}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="NEWEST">Most recently reviewed</option>
            <option value="OLDEST">Earliest reviewed first</option>
          </Select>
        </label>
        <Button type="submit" variant="primary">
          Filter
        </Button>
        <Link href="/mentor/task-review-history" className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Clear
        </Link>
      </form>
      <p className="text-sm text-body">{data.total} matching reviewed task version{data.total===1?"":"s"}</p>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={"/api/mentor/task-review-history/export?"+
          new URLSearchParams({decision:data.query.decision,priority:data.query.priority,
            order:data.query.order,search:data.query.search}).toString()}
          download className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Export reviewed task decisions CSV (max 200)
        </Link>
        {data.total>200?<span role="status">
          CSV excludes {data.total-200} additional matching versions.
        </span>:null}
      </div>
      {data.items.length===0 ? <EmptyState title="No reviewed task submissions"
        description="No registered approved or changes-requested task versions match this filter and your current project assignments. Unmigrated history is not inferred." />
      : <ol className="divide-y divide-border">{data.items.map(item=>
        <li key={item.id} className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-foreground">{item.taskTitle}</h2>
            <span className="text-sm font-semibold text-body">{taskReviewDecisionLabel(item.status)}</span>
          </div>
          <p className="mt-2 text-sm text-body">{item.projectTitle} · Version {item.version}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Reviewed {item.reviewedAt
              ? new Intl.DateTimeFormat("en-IN",{
                dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
              }).format(item.reviewedAt)+" IST" : "date not recorded"}
          </p>
          <Link href={"/mentor/projects/"+encodeURIComponent(item.projectId)+"?tab=board"}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Open authorized Board →
          </Link>
          <Link href={"/mentor/projects/"+encodeURIComponent(item.projectId)+
            "/tasks/"+encodeURIComponent(item.taskId)+"/feedback"}
            className="ml-4 inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Recorded feedback →
          </Link>
        </li>)}</ol>}
      <Pagination label="Reviewed task history pagination" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorTaskHistoryHref({...data.query,page})}/>
    </>}
    <p className="text-xs leading-5 text-muted-foreground">
      This is assigned-project decision history, not a list of reviews personally
      authored by the current Mentor. Raw feedback, learner identities and submission URLs
      are not returned. All review writes stay in the existing authorized Board.
    </p>
  </div>;
}
