import { Tabs } from "@/components/ui/tabs";
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
  mentorReviewDecisionLabel, mentorReviewHistoryHref, mentorReviewHistoryQuerySchema,
} from "@/modules/projects/mentor-review-history-model";
import { getMentorReviewHistory } from "@/modules/projects/mentor-review-history-service";

type Search = { projectState?:string|string[];window?:string|string[];order?:string|string[];version?:string|string[];projectId?:string|string[];decision?: string | string[]; search?: string | string[]; page?: string | string[] };
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function MentorReviewHistoryPage({
  searchParams,
}: { searchParams: Promise<Search> }) {
  const raw=await searchParams;
  const parsed=mentorReviewHistoryQuerySchema.safeParse(Object.values(raw).some(Array.isArray)?null:{
    decision:first(raw.decision) ?? undefined, search:first(raw.search) ?? undefined,
    projectId:first(raw.projectId) ?? undefined,
    projectState:first(raw.projectState) ?? undefined,
    version:first(raw.version) ?? undefined,
    order:first(raw.order) ?? undefined,
    window:first(raw.window) ?? undefined,
    page:first(raw.page) ?? undefined,
  });
  if (!parsed.success) return <section role="alert" className="space-y-3">
    <h1 className="font-semibold text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Invalid review history filters</h1>
    <Link href="/mentor/review-history" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lms-inline-link">Clear filters</Link>
  </section>;
  const context=await getCurrentRequestContext();
  if (!hasMembershipRole(context,"MENTOR")) redirect("/dashboard");
  const data=await getMentorReviewHistory(context,parsed.data);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Mentor · Delivery" title="Delivery review history"
      description="Recorded final-delivery review decisions for projects currently assigned to you."
      actions={<Link href="/mentor/reviews"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Pending reviews
      </Link>} />
    {!data.enabled ?
      <section role="status" className="border-b border-border pb-4 text-sm text-body">
        Projects access is disabled for this membership. No review history was loaded.
      </section>
    : <>
      <form method="get" action="/mentor/review-history"
        className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
        <Input type="hidden" name="decision" value={data.query.decision}/>
        <label className="grid gap-1 text-sm font-semibold text-body">Project title
          <Input name="search" type="search" maxLength={120} defaultValue={data.query.search}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3"/>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Assigned project
          <Select name="projectId" defaultValue={data.query.projectId??""} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="">All assigned projects</option>
            {data.projects.map(project=><option key={project.id} value={project.id}>{project.title}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Project lifecycle
          <Select name="projectState" defaultValue={data.query.projectState} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">Any project state</option><option value="PLANNED">Planned</option>
            <option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Delivery submission version
          <Input name="version" type="number" min={1} max={100000} defaultValue={data.query.version??""} placeholder="All versions" className="min-h-11 sm:min-h-9 w-36 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3"/>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Review chronology
          <Select name="order" defaultValue={data.query.order} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="NEWEST">Latest decision first</option><option value="OLDEST">Earliest decision first</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Recorded decision within
          <Select name="window" defaultValue={data.query.window} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All registered dates</option><option value="LAST_7_DAYS">Last 7 days</option><option value="LAST_30_DAYS">Last 30 days</option><option value="OLDER_THAN_30_DAYS">Older than 30 days</option>
          </Select>
        </label>
        <Button type="submit" variant="primary">Search</Button>
        <Link href="/mentor/review-history" className="inline-flex min-h-11 items-center text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lms-inline-link">Clear</Link>
      </form>
      <Tabs ariaLabel="Review decision filter" renderPanel={false} value={data.query.decision} items={([["ALL","All decisions"],["APPROVED","Approved"],["CHANGES_REQUESTED","Changes requested"]] as const).map(([decision,label])=>({value:decision,label,href:mentorReviewHistoryHref({...data.query,decision,page:1})}))}/>
      <p className="text-sm text-body">
        {data.total} persisted delivery decision{data.total === 1 ? "" : "s"} across assigned projects
      </p>
      {data.items.length===0
        ? <EmptyState title="No recorded delivery reviews"
            description="No persisted final-delivery decisions match this filter for your currently assigned projects. Historical records before migration are not reconstructed." />
        : <ol className="divide-y divide-border">{data.items.map(item =>
          <li key={item.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-foreground">{item.projectTitle}</h2>
              <span className="text-sm font-semibold text-body">
                {mentorReviewDecisionLabel(item.decision)}
              </span>
            </div>
            <p className="mt-2 text-sm text-body">
              Final delivery version {item.version} · Reviewed{" "}
              {new Intl.DateTimeFormat("en-IN",{
                dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
              }).format(item.reviewedAt)} IST
            </p>
            <Link href={"/mentor/projects/"+encodeURIComponent(item.projectId)+"?tab=delivery"}
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Open authorized delivery history →
            </Link>
          </li>)}</ol>}
      <nav aria-label="Delivery history pagination" className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</p>
        <div className="flex gap-3">
          {data.page>1 && <Link href={mentorReviewHistoryHref({...data.query,page:data.page-1})}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Previous</Link>}
          {data.page<data.totalPages && <Link href={mentorReviewHistoryHref({...data.query,page:data.page+1})}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next</Link>}
        </div>
      </nav>
    </>}
    <p className="text-xs leading-5 text-muted-foreground">
      This is project-level review history, not a record of decisions personally
      authored by the current Mentor. Raw feedback and learner identities are
      not returned. Only registered decision rows are shown; active assignment is required.
    </p>
  </div>;
}
