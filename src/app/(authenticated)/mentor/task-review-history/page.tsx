import { FilterBar } from "@/components/ui/filter-bar";
import { Disclosure } from "@/components/ui/disclosure";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  mentorTaskHistoryHref, mentorTaskHistoryQuerySchema, taskReviewDecisionLabel,
} from "@/modules/projects/mentor-task-history-model";
import { getMentorTaskReviewHistory } from "@/modules/projects/mentor-task-history-service";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { formatNumberIN } from "@/lib/safe-format";
import { istDateTimeFormatter } from "@/lib/format-date";

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
    <TextLink href="/mentor/task-review-history" className="inline-flex min-h-11 items-center">Clear filters</TextLink>
  </section>;
  const context=await getCurrentRequestContext();
  if(!hasMembershipRole(context,"MENTOR")) redirect("/dashboard");
  const data=await getMentorTaskReviewHistory(context,parsed.data);
  const hasFilters = Boolean(data.query.search || data.query.decision !== "ALL" || data.query.priority !== "ALL" || data.query.order !== "NEWEST");
  const hasAdvancedFilters = data.query.priority !== "ALL" || data.query.order !== "NEWEST";
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Mentor · Task Board" title="Reviewed task submissions"
      description="Registered task decisions on projects currently assigned to you."
      actions={<TextLink href="/mentor/task-reviews"
        className="inline-flex min-h-11 items-center text-sm md:min-h-9">
        Pending task reviews
      </TextLink>} />
    {!data.enabled ? <section role="status"
      className="border-b border-border pb-4 text-sm text-body">
      Projects access is disabled. Reviewed task history is unavailable.
    </section> : <>
      <FilterBar title="Filters" activeCount={Number(Boolean(data.query.search))+Number(data.query.decision!=="ALL")+Number(data.query.priority!=="ALL")+Number(data.query.order!=="NEWEST")}><form role="search" aria-label="mentor task review history filters" action="/mentor/task-review-history" method="get"
        className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-border pb-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Label stack>Task or project
          <Input type="search" name="search" defaultValue={data.query.search} maxLength={120}
            className="min-h-11 md:min-h-9" />
        </Label>
        <Label stack>Decision
          <Select name="decision" defaultValue={data.query.decision}
            className="min-h-11 md:min-h-9">
            <option value="ALL">All reviews</option>
            <option value="APPROVED">Approved</option>
            <option value="CHANGES_REQUESTED">Changes requested</option>
          </Select>
        </Label>
        <div className="flex min-w-0 flex-wrap items-center gap-2 md:col-span-1">
          <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9 md:w-auto">Filter</Button>
          {hasFilters?<TextLink href="/mentor/task-review-history" className="inline-flex min-h-11 items-center px-3 py-2 text-sm">Clear</TextLink>:null}
        </div>
        <Disclosure title="More review history filters" defaultOpen={hasAdvancedFilters} className="md:col-span-3" contentClassName="grid min-w-0 grid-cols-1 gap-3 pt-3 md:grid-cols-2">
        <Label stack>Task priority
          <Select name="priority" defaultValue={data.query.priority}
            className="min-h-11 md:min-h-9">
            <option value="ALL">All priorities</option><option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option><option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </Label>
        <Label stack>Review chronology
          <Select name="order" defaultValue={data.query.order}
            className="min-h-11 md:min-h-9">
            <option value="NEWEST">Most recently reviewed</option>
            <option value="OLDEST">Earliest reviewed first</option>
          </Select>
        </Label>
        </Disclosure>

      </form></FilterBar>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-sm">
        <p className="font-medium text-body">{formatNumberIN(data.total)} matching reviewed task version{data.total===1?"":"s"}</p>
        <div className="flex flex-wrap items-center gap-3">
        <TextLink data-unskin="" href={"/api/mentor/task-review-history/export?"+
          new URLSearchParams({decision:data.query.decision,priority:data.query.priority,
            order:data.query.order,search:data.query.search}).toString()}
          download className="inline-flex min-h-11 items-center text-sm md:min-h-9">
          Export reviewed task decisions CSV (max 200)
        </TextLink>
        {data.total>200?<span role="status">
          CSV excludes {data.total-200} additional matching versions.
        </span>:null}
        </div>
      </div>
      {data.items.length===0 ? <EmptyState title="No reviewed task submissions"
        description="No registered approved or changes-requested task versions match this filter and your current project assignments. Unmigrated history is not inferred."
        action={<TextLink href={hasFilters ? "/mentor/task-review-history" : "/mentor/task-reviews"} className="inline-flex min-h-11 items-center text-sm md:min-h-9">{hasFilters ? "Clear filters" : "Pending task reviews"}</TextLink>} />
      : <ol aria-label="mentor task review history entries" className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(item=>
        <li key={item.id} className="py-[var(--lms-space-3)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Heading level={2} className="min-w-0 break-words text-[var(--lms-font-lg)] leading-7 text-[var(--lms-heading)]">{item.taskTitle}</Heading>
            <span className="text-sm font-semibold text-body">{taskReviewDecisionLabel(item.status)}</span>
          </div>
          <p className="mt-2 text-sm text-body leading-[22px]">{item.projectTitle} · Version {item.version}</p>
          <p className="mt-1 text-xs text-muted-foreground leading-5">
            Reviewed {item.reviewedAt
              ? istDateTimeFormatter.format(item.reviewedAt)+" IST" : "date not recorded"}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <TextLink href={"/mentor/projects/"+encodeURIComponent(item.projectId)+"?tab=board"}
            className="mt-3 inline-flex min-h-11 items-center text-sm">
            Open authorized Board →
          </TextLink>
          <TextLink href={"/mentor/projects/"+encodeURIComponent(item.projectId)+
            "/tasks/"+encodeURIComponent(item.taskId)+"/feedback"}
            className="inline-flex min-h-11 items-center text-sm">
            Recorded feedback →
          </TextLink>
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
