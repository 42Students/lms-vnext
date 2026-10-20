import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {mentorReviewOverviewSchema,mentorReviewOverviewHref} from "@/modules/projects/mentor-review-overview-model";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {getMentorDeliveryReviewOverview} from "@/modules/projects/mentor-review-overview-service";
type Search={status?:string|string[];feedback?:string|string[];version?:string|string[];page?:string|string[]};
export default async function MentorReviewOverviewPage({
 params,searchParams,
}:{params:Promise<{projectId:string}>;searchParams:Promise<Search>}){
 const [{projectId},query]=await Promise.all([params,searchParams]);
 const filters=singleValueMentorFilters({
  page:query.page,status:query.status,feedback:query.feedback,version:query.version,
 });
 // Duplicate query parameters must not silently select an attacker-chosen filter.
 const parsed=mentorReviewOverviewSchema.safeParse(
  filters?{projectId,...filters}:null,
 );
 if(!parsed.success)return <section role="alert">
 <PageHeader title={"Invalid project review filters"} />
 <Link href="/mentor/projects" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lms-inline-link hover:text-[var(--lms-primary-text)]">Projects</Link>
 </section>;
 const data=await getMentorDeliveryReviewOverview(await getCurrentRequestContext(),parsed.data);
 const filtered=data.query.status!=="ALL"||data.query.feedback!=="ALL"||data.query.version!==undefined;
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
 <PageHeader eyebrow="Mentor · Project" title="Delivery review overview"
 description={data.project.title+" · "+data.project.status}
 actions={<Link data-unskin="" href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"}
  className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
  Delivery workspace</Link>}/>
 <FilterBar title="Filters"><form method="get" action={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"} role="search" aria-label="Delivery review filters"
 className="grid min-w-0 items-end gap-3 border-b border-border pb-4 md:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto_auto]">
  <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Delivery status
   <Select name="status" defaultValue={data.query.status}
    className="min-h-11 min-[768px]:min-h-9">
    {(["ALL","DRAFT","SUBMITTED","APPROVED","CHANGES_REQUESTED"] as const).map(status=>
     <option key={status} value={status}>{status.replaceAll("_"," ")}</option>)}
   </Select>
  </label>
  <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Written feedback
   <Select name="feedback" defaultValue={data.query.feedback}
    className="min-h-11 min-[768px]:min-h-9">
    <option value="ALL">Any</option>
    <option value="WITH">Recorded</option>
    <option value="WITHOUT">Not recorded</option>
   </Select>
  </label>
  <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Exact delivery version
   <Input type="number" name="version" min={1} max={1000000}
    defaultValue={data.query.version??""}
    placeholder="All versions" className="min-h-11 min-[768px]:min-h-9"/>
  </label>
  <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9 xl:w-auto">
   Filter
  </Button>
  {filtered?<Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"}
   className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:text-[var(--lms-primary-text)]">Clear</Link>:null}
 </form></FilterBar>
 <div className="flex flex-wrap items-center gap-3 text-sm">
  <Link data-unskin="" href={"/api/projects/"+encodeURIComponent(projectId)+"/mentor-delivery-review-export?"+
   new URLSearchParams({status:data.query.status,feedback:data.query.feedback,
    ...(data.query.version===undefined?{}:{version:String(data.query.version)})}).toString()}
   download className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
   Export filtered delivery review CSV (max 200)
  </Link>
  {data.total>200?<p role="status">CSV omits {data.total-200} versions beyond the cap.</p>:null}
 </div>
 <section className="min-w-0 border-b border-border pb-4">
 <h2 className="m-0 text-base font-semibold leading-6 text-[var(--lms-heading)]">Recorded review coverage on this page</h2>
 <p className="mt-2 text-sm text-body leading-[22px]">{data.counts.reviewed} reviewed version{data.counts.reviewed===1?"":"s"};
 {" "}{data.counts.withFeedback} with written feedback.</p>
 <p className="mt-1 text-xs text-muted-foreground leading-5">
 Counts apply to the current page of registered delivery versions. Feedback is optional for approval
 and required when changes are requested. Missing records are not assumed complete.
 </p></section>
 <p className="text-sm text-body leading-[22px]">{data.total} registered delivery version{data.total===1?"":"s"}</p>
 {data.items.length===0?<EmptyState title="No registered final delivery"
 description="There is no persisted final-delivery version for this authorized project. Nothing was submitted or reviewed here in the registered history." action={filtered?<Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"} className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Clear</Link>:<Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"} className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Delivery workspace</Link>}/>
 :<ol className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(item=>
 <li key={item.id} className="py-[var(--lms-space-3)]">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <h2 className="m-0 text-base font-semibold leading-6 text-[var(--lms-heading)]">Delivery version {item.version}</h2>
 <span className="text-xs font-semibold text-body">{item.status}</span></div>
 <p className="mt-2 text-sm text-body leading-[22px]">{item.reviewLabel}</p>
 <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+
  "/deliveries/"+encodeURIComponent(item.id)+"/review"}
  className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:text-[var(--lms-primary-text)]">
  View recorded review details
 </Link>
 <p className="mt-1 text-xs text-muted-foreground leading-5">
 {item.submittedAt?"Submitted "+new Intl.DateTimeFormat("en-IN",{
 dateStyle:"medium",timeZone:"Asia/Kolkata",
 }).format(item.submittedAt)+" IST":"No recorded submission"}
 </p>
 <p className="mt-1 text-xs text-muted-foreground leading-5">
 {item.reviewedAt?"Reviewed "+new Intl.DateTimeFormat("en-IN",{
 dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(item.reviewedAt)+" IST":"No recorded review instant"}
 </p>
 </li>)}</ol>}
 {data.totalPages>1?<Pagination label="Delivery review history pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorReviewOverviewHref({...data.query,page})}/>:null}
 <p className="text-xs text-muted-foreground leading-5">
 Only registered decision and feedback presence are shown. Historical missing versions,
 former assignments, reviewer authorship and raw private feedback are not inferred or exposed.
 This page cannot create or change reviews.
 </p>
 </div>;
}
