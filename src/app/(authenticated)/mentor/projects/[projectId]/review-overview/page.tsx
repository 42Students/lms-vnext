import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {PageHeader} from "@/components/ui/page-header";
import {mentorReviewOverviewSchema,mentorReviewOverviewHref} from "@/modules/projects/mentor-review-overview-model";
import {getMentorDeliveryReviewOverview} from "@/modules/projects/mentor-review-overview-service";
type Search={status?:string|string[];feedback?:string|string[];page?:string|string[]};
export default async function MentorReviewOverviewPage({
 params,searchParams,
}:{params:Promise<{projectId:string}>;searchParams:Promise<Search>}){
 const [{projectId},query]=await Promise.all([params,searchParams]);
 const parsed=mentorReviewOverviewSchema.safeParse({
  projectId,page:Array.isArray(query.page)?query.page[0]:query.page,
  status:Array.isArray(query.status)?query.status[0]:query.status,
  feedback:Array.isArray(query.feedback)?query.feedback[0]:query.feedback,
 });
 if(!parsed.success)return <section role="alert">
 <h1 className="text-xl font-semibold">Invalid project review filters</h1>
 <Link href="/mentor/projects" className="text-primary-text underline">Projects</Link>
 </section>;
 const data=await getMentorDeliveryReviewOverview(await getCurrentRequestContext(),parsed.data);
 return <div className="space-y-6">
 <PageHeader eyebrow="Mentor · Project" title="Delivery review overview"
 description={data.project.title+" · "+data.project.status}
 actions={<Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"}
  className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
  Delivery workspace</Link>}/>
 <form method="get" action={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"}
 className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
  <label className="grid gap-1 text-sm font-semibold text-body">Delivery status
   <select name="status" defaultValue={data.query.status}
    className="min-h-10 rounded-md border border-border bg-background px-3">
    {(["ALL","DRAFT","SUBMITTED","APPROVED","CHANGES_REQUESTED"] as const).map(status=>
     <option key={status} value={status}>{status.replaceAll("_"," ")}</option>)}
   </select>
  </label>
  <label className="grid gap-1 text-sm font-semibold text-body">Written feedback
   <select name="feedback" defaultValue={data.query.feedback}
    className="min-h-10 rounded-md border border-border bg-background px-3">
    <option value="ALL">Any</option>
    <option value="WITH">Recorded</option>
    <option value="WITHOUT">Not recorded</option>
   </select>
  </label>
  <button type="submit" className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
   Filter
  </button>
  <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"}
   className="text-sm font-semibold text-primary-text underline">Clear</Link>
 </form>
 <div className="flex flex-wrap items-center gap-3 text-sm">
  <Link href={"/api/projects/"+encodeURIComponent(projectId)+"/mentor-delivery-review-export?"+
   new URLSearchParams({status:data.query.status,feedback:data.query.feedback}).toString()}
   download className="inline-flex min-h-10 items-center rounded-md border border-border px-4 font-semibold text-primary-text">
   Export filtered delivery review CSV (max 200)
  </Link>
  {data.total>200?<p role="status">CSV omits {data.total-200} versions beyond the cap.</p>:null}
 </div>
 <section className="rounded-xl border border-border bg-surface p-5">
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
 :<ol className="grid gap-3">{data.items.map(item=>
 <li key={item.id} className="rounded-xl border border-border bg-surface p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <h2 className="font-semibold">Delivery version {item.version}</h2>
 <span className="text-xs font-semibold text-body">{item.status}</span></div>
 <p className="mt-2 text-sm text-body">{item.reviewLabel}</p>
 <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+
  "/deliveries/"+encodeURIComponent(item.id)+"/review"}
  className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
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
 className="text-sm font-semibold text-primary-text">Previous</Link>}
 {data.page<data.totalPages&&<Link href={mentorReviewOverviewHref({...data.query,page:data.page+1})}
 className="text-sm font-semibold text-primary-text">Next</Link>}
 </div></nav>
 <p className="text-xs text-muted-foreground">
 Only registered decision and feedback presence are shown. Historical missing versions,
 former assignments, reviewer authorship and raw private feedback are not inferred or exposed.
 This page cannot create or change reviews.
 </p>
 </div>;
}
