import { FilterBar } from "@/components/ui/filter-bar";
import { Disclosure } from "@/components/ui/disclosure";
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
    <PageHeader title={"Invalid review history filters"} />
    <Link href="/mentor/task-review-history" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lms-inline-link hover:text-[var(--lms-primary-text)]">Clear filters</Link>
  </section>;
  const context=await getCurrentRequestContext();
  if(!hasMembershipRole(context,"MENTOR")) redirect("/dashboard");
  const data=await getMentorTaskReviewHistory(context,parsed.data);
  const hasFilters = Boolean(data.query.search || data.query.decision !== "ALL" || data.query.priority !== "ALL" || data.query.order !== "NEWEST");
  const hasAdvancedFilters = data.query.priority !== "ALL" || data.query.order !== "NEWEST";
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Mentor · Task Board" title="Reviewed task submissions"
      description="Registered task decisions on projects currently assigned to you."
      actions={<Link href="/mentor/task-reviews"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        Pending task reviews
      </Link>} />
    {!data.enabled ? <section role="status"
      className="border-b border-border pb-4 text-sm text-body">
      Projects access is disabled. Reviewed task history is unavailable.
    </section> : <>
      <FilterBar title="Filters" activeCount={Number(hasFilters)}><form role="search" aria-label="mentor task review history filters" action="/mentor/task-review-history" method="get"
        className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-border pb-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Task or project
          <Input type="search" name="search" defaultValue={data.query.search} maxLength={120}
            className="min-h-11 min-[768px]:min-h-9" />
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Decision
          <Select name="decision" defaultValue={data.query.decision}
            className="min-h-11 min-[768px]:min-h-9">
            <option value="ALL">All reviews</option>
            <option value="APPROVED">Approved</option>
            <option value="CHANGES_REQUESTED">Changes requested</option>
          </Select>
        </label>
        <Disclosure title="More review history filters" defaultOpen={hasAdvancedFilters} className="md:col-span-2" contentClassName="grid min-w-0 grid-cols-1 gap-3 pt-3 md:grid-cols-2">
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Task priority
          <Select name="priority" defaultValue={data.query.priority}
            className="min-h-11 min-[768px]:min-h-9">
            <option value="ALL">All priorities</option><option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option><option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Review chronology
          <Select name="order" defaultValue={data.query.order}
            className="min-h-11 min-[768px]:min-h-9">
            <option value="NEWEST">Most recently reviewed</option>
            <option value="OLDEST">Earliest reviewed first</option>
          </Select>
        </label>
        </Disclosure>
        <div className="flex min-w-0 flex-wrap items-center gap-2 md:col-span-2">
          <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9 md:w-auto">Filter</Button>
          <Link href="/mentor/task-review-history" className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lms-inline-link hover:text-[var(--lms-primary-text)]">Clear</Link>
        </div>
      </form></FilterBar>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-sm">
        <p className="font-medium text-body">{data.total} matching reviewed task version{data.total===1?"":"s"}</p>
        <div className="flex flex-wrap items-center gap-3">
        <Link data-unskin="" href={"/api/mentor/task-review-history/export?"+
          new URLSearchParams({decision:data.query.decision,priority:data.query.priority,
            order:data.query.order,search:data.query.search}).toString()}
          download className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Export reviewed task decisions CSV (max 200)
        </Link>
        {data.total>200?<span role="status">
          CSV excludes {data.total-200} additional matching versions.
        </span>:null}
        </div>
      </div>
      {data.items.length===0 ? <EmptyState title="No reviewed task submissions"
        description="No registered approved or changes-requested task versions match this filter and your current project assignments. Unmigrated history is not inferred."
        action={<Link href={hasFilters ? "/mentor/task-review-history" : "/mentor/task-reviews"} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">{hasFilters ? "Clear filters" : "Pending task reviews"}</Link>} />
      : <ol aria-label="mentor task review history entries" className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(item=>
        <li key={item.id} className="py-[var(--lms-space-3)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="min-w-0 break-words text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">{item.taskTitle}</h2>
            <span className="text-sm font-semibold text-body">{taskReviewDecisionLabel(item.status)}</span>
          </div>
          <p className="mt-2 text-sm text-body leading-[22px]">{item.projectTitle} · Version {item.version}</p>
          <p className="mt-1 text-xs text-muted-foreground leading-5">
            Reviewed {item.reviewedAt
              ? new Intl.DateTimeFormat("en-IN",{
                dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
              }).format(item.reviewedAt)+" IST" : "date not recorded"}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href={"/mentor/projects/"+encodeURIComponent(item.projectId)+"?tab=board"}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Open authorized Board →
          </Link>
          <Link href={"/mentor/projects/"+encodeURIComponent(item.projectId)+
            "/tasks/"+encodeURIComponent(item.taskId)+"/feedback"}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Recorded feedback →
          </Link>
          </div>
        </li>)}</ol>}
      {data.totalPages > 1 ? <Pagination label="Reviewed task history pagination" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorTaskHistoryHref({...data.query,page})}/> : null}
    </>}
    <p className="text-xs leading-5 text-muted-foreground">
      This is assigned-project decision history, not a list of reviews personally
      authored by the current Mentor. Raw feedback, learner identities and submission URLs
      are not returned. All review writes stay in the existing authorized Board.
    </p>
  </div>;
}
