import { FilterBar } from "@/components/ui/filter-bar";
import { Disclosure } from "@/components/ui/disclosure";
import { Pagination } from "@/components/ui/pagination";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  mentorReviewDecisionLabel, mentorReviewHistoryHref, mentorReviewHistoryQuerySchema,
} from "@/modules/projects/mentor-review-history-model";
import { getMentorReviewHistory } from "@/modules/projects/mentor-review-history-service";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { formatNumberIN } from "@/lib/safe-format";
import { istDateTimeFormatter } from "@/lib/format-date";

type Search = { projectState?:string|string[];window?:string|string[];order?:string|string[];version?:string|string[];projectId?:string|string[];decision?: string | string[]; search?: string | string[]; page?: string | string[] };
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function MentorReviewHistoryPage({
  searchParams,
}: { searchParams: Promise<Search> }) {
  const context=await getCurrentRequestContext();
  if (!hasMembershipRole(context,"MENTOR")) redirect("/dashboard");
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
    <PageHeader title="Delivery review history" description="Invalid review history filters" />
    <p className="text-sm text-body">The filters could not be applied. No review history was loaded.</p>
    <TextLink href="/mentor/review-history" className="inline-flex min-h-11 items-center">Clear filters</TextLink>
  </section>;
  const data=await getMentorReviewHistory(context,parsed.data);
  const hasFilters=Boolean(data.query.search||data.query.projectId||data.query.decision!=="ALL"||data.query.projectState!=="ALL"||data.query.version!==undefined||data.query.order!=="NEWEST"||data.query.window!=="ALL");
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title="Delivery review history"
      description="Recorded final-delivery review decisions for projects currently assigned to you."
      actions={<TextLink data-unskin="" href="/mentor/reviews"
        className="inline-flex min-h-11 items-center text-sm md:min-h-9">
        Pending reviews
      </TextLink>} />
    {!data.enabled ?
      <section role="status" className="border-b border-border pb-4 text-sm text-body">
        Projects access is disabled for this membership. No review history was loaded.
      </section>
    : <>
      <Tabs ariaLabel="Review decision filter" renderPanel={false} value={data.query.decision} items={([["ALL","All decisions"],["APPROVED","Approved"],["CHANGES_REQUESTED","Changes requested"]] as const).map(([decision,label])=>({value:decision,label,href:mentorReviewHistoryHref({...data.query,decision,page:1})}))}/>
      <FilterBar title="Filters" activeCount={Number(Boolean(data.query.search))+Number(Boolean(data.query.projectId))+Number(data.query.projectState!=="ALL")+Number(Boolean(data.query.version))+Number(data.query.order!=="NEWEST")+Number(data.query.window!=="ALL")}>
        <form role="search" aria-label="mentor review history filters" method="get" action="/mentor/review-history"
          className="min-w-0 space-y-3 border-b border-border pb-4">
        <Input type="hidden" name="decision" value={data.query.decision}/>
          <div className="grid min-w-0 items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <Label stack>Project title
              <Input name="search" type="search" maxLength={120} defaultValue={data.query.search}
                className="min-h-11 md:min-h-9"/>
            </Label>
            <Label stack>Assigned project
              <Select name="projectId" defaultValue={data.query.projectId??""} className="min-h-11 md:min-h-9">
                <option value="">All assigned projects</option>
                {data.projects.map(project=><option key={project.id} value={project.id}>{project.title}</option>)}
              </Select>
            </Label>
            <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>
          </div>
          <Disclosure title="Filters" defaultOpen={data.query.projectState!=="ALL"||Boolean(data.query.version)||data.query.order!=="NEWEST"||data.query.window!=="ALL"} className="min-w-0" contentClassName="min-w-0 pt-3 pb-2">
            <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Label stack>Project lifecycle
              <Select name="projectState" defaultValue={data.query.projectState} className="min-h-11 md:min-h-9">
                <option value="ALL">Any project state</option><option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </Label>
            <Label stack>Delivery submission version
              <Input name="version" type="number" min={1} max={100000} defaultValue={data.query.version??""} placeholder="All versions" className="min-h-11 w-full max-w-full md:min-h-9 md:w-36"/>
            </Label>
            <Label stack>Review chronology
              <Select name="order" defaultValue={data.query.order} className="min-h-11 md:min-h-9">
                <option value="NEWEST">Latest decision first</option><option value="OLDEST">Earliest decision first</option>
              </Select>
            </Label>
            <Label stack>Recorded decision within
              <Select name="window" defaultValue={data.query.window} className="min-h-11 md:min-h-9">
                <option value="ALL">All registered dates</option><option value="LAST_7_DAYS">Last 7 days</option><option value="LAST_30_DAYS">Last 30 days</option><option value="OLDER_THAN_30_DAYS">Older than 30 days</option>
              </Select>
            </Label>
            </div>
          </Disclosure>
          {(data.query.decision!=="ALL"||Boolean(data.query.search)||Boolean(data.query.projectId)||data.query.projectState!=="ALL"||data.query.version!==undefined||data.query.order!=="NEWEST"||data.query.window!=="ALL")?<TextLink href="/mentor/review-history" className="inline-flex min-h-11 items-center text-sm md:min-h-9">Clear</TextLink>:null}
        </form>
      </FilterBar>

      <p className="text-sm text-body leading-[22px]">
        {formatNumberIN(data.total)} persisted delivery decision{data.total === 1 ? "" : "s"} across assigned projects
      </p>
      {data.items.length===0
        ? <EmptyState title="No recorded delivery reviews"
            description={hasFilters?"No persisted final-delivery decisions match these filters for your currently assigned projects.":"No final-delivery review decisions are recorded for your currently assigned projects. Historical records before migration are not reconstructed."} action={<TextLink href={hasFilters?"/mentor/review-history":"/mentor/reviews"} className="inline-flex min-h-11 items-center md:min-h-9">{hasFilters?"Clear filters":"Pending reviews"}</TextLink>} />
        : <ol aria-label="mentor review history entries" className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(item =>
          <li key={item.id} className="py-[var(--lms-space-3)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Heading level={2} size="base" className="m-0 leading-6 text-[var(--lms-heading)]">{item.projectTitle}</Heading>
              <span className="text-sm font-semibold text-body">
                {mentorReviewDecisionLabel(item.decision)}
              </span>
            </div>
            <p className="mt-2 text-sm text-body leading-[22px]">
              Final delivery version {item.version} · Reviewed{" "}
              {istDateTimeFormatter.format(item.reviewedAt)} IST
            </p>
            <TextLink href={"/mentor/projects/"+encodeURIComponent(item.projectId)+"?tab=delivery"}
              className="mt-3 inline-flex min-h-11 items-center text-sm">
              Open authorized delivery history →
            </TextLink>
          </li>)}</ol>}
      {data.totalPages>1?<Pagination label="Delivery history pagination" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorReviewHistoryHref({...data.query,page})}/>:null}
    </>}
    <p className="text-xs leading-5 text-muted-foreground">
      This is project-level review history, not a record of decisions personally
      authored by the current Mentor. Raw feedback and learner identities are
      not returned. Only registered decision rows are shown; active assignment is required.
    </p>
  </div>;
}
