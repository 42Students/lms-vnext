import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {PageHeader} from "@/components/ui/page-header";
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
 <PageHeader title="Invalid project review filters" />
 <Link href="/mentor/projects" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Projects</Link>
 </section>;
 const data=await getMentorDeliveryReviewOverview(await getCurrentRequestContext(),parsed.data);
 return <div className="min-w-0 max-w-full space-y-6">
 <PageHeader eyebrow="Mentor · Project" title="Delivery review overview"
 description={data.project.title+" · "+data.project.status}
 actions={<Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"}
  className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
  Delivery workspace</Link>}/>
 <form method="get" action={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"}
 className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
  <label className="grid gap-1 text-sm font-semibold text-body">Delivery status
   <Select name="status" defaultValue={data.query.status}
    className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
    {(["ALL","DRAFT","SUBMITTED","APPROVED","CHANGES_REQUESTED"] as const).map(status=>
     <option key={status} value={status}>{status.replaceAll("_"," ")}</option>)}
   </Select>
  </label>
  <label className="grid gap-1 text-sm font-semibold text-body">Written feedback
   <Select name="feedback" defaultValue={data.query.feedback}
    className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
    <option value="ALL">Any</option>
    <option value="WITH">Recorded</option>
    <option value="WITHOUT">Not recorded</option>
   </Select>
  </label>
  <label className="grid gap-1 text-sm font-semibold text-body">Exact delivery version
   <Input type="number" name="version" min={1} max={1000000}
    defaultValue={data.query.version??""}
    placeholder="All versions" className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3"/>
  </label>
  <Button type="submit" variant="primary">
   Filter
  </Button>
  <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"}
   className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear</Link>
 </form>
 <div className="flex flex-wrap items-center gap-3 text-sm">
  <Link href={"/api/projects/"+encodeURIComponent(projectId)+"/mentor-delivery-review-export?"+
   new URLSearchParams({status:data.query.status,feedback:data.query.feedback,
    ...(data.query.version===undefined?{}:{version:String(data.query.version)})}).toString()}
   download className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
   Export filtered delivery review CSV (max 200)
  </Link>
  {data.total>200?<p role="status">CSV omits {data.total-200} versions beyond the cap.</p>:null}
 </div>
 <section className="border-b border-border pb-5">
 <h2 className="font-semibold">Recorded review coverage on this page</h2>
 <p className="mt-2 text-sm text-body">{data.counts.reviewed} reviewed version{data.counts.reviewed===1?"":"s"};
 {" "}{data.counts.withFeedback} with written feedback.</p>
 <p className="mt-1 text-xs text-muted-foreground">
 Counts apply to the current page of registered delivery versions. Feedback is optional for approval
 and required when changes are requested. Missing records are not assumed complete.
 </p></section>
 <p className="text-sm text-body">{data.total} registered delivery version{data.total===1?"":"s"}</p>
 {data.items.length===0?<EmptyState title="No registered final delivery"
 description="There is no persisted final-delivery version for this authorized project. Nothing was submitted or reviewed here in the registered history."/>
 :<ol className="divide-y divide-border">{data.items.map(item=>
 <li key={item.id} className="py-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <h2 className="font-semibold">Delivery version {item.version}</h2>
 <span className="text-xs font-semibold text-body">{item.status}</span></div>
 <p className="mt-2 text-sm text-body">{item.reviewLabel}</p>
 <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+
  "/deliveries/"+encodeURIComponent(item.id)+"/review"}
  className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
  View recorded review details
 </Link>
 <p className="mt-1 text-xs text-muted-foreground">
 {item.submittedAt?"Submitted "+new Intl.DateTimeFormat("en-IN",{
 dateStyle:"medium",timeZone:"Asia/Kolkata",
 }).format(item.submittedAt)+" IST":"No recorded submission"}
 </p>
 <p className="mt-1 text-xs text-muted-foreground">
 {item.reviewedAt?"Reviewed "+new Intl.DateTimeFormat("en-IN",{
 dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(item.reviewedAt)+" IST":"No recorded review instant"}
 </p>
 </li>)}</ol>}
 <nav aria-label="Delivery review history pages" className="flex items-center justify-between gap-3">
 <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
 <div className="flex gap-3">
 {data.page>1&&<Link href={mentorReviewOverviewHref({...data.query,page:data.page-1})}
 className="inline-flex min-h-11 items-center text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Previous</Link>}
 {data.page<data.totalPages&&<Link href={mentorReviewOverviewHref({...data.query,page:data.page+1})}
 className="inline-flex min-h-11 items-center text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next</Link>}
 </div></nav>
 <p className="text-xs text-muted-foreground">
 Only registered decision and feedback presence are shown. Historical missing versions,
 former assignments, reviewer authorship and raw private feedback are not inferred or exposed.
 This page cannot create or change reviews.
 </p>
 </div>;
}
