import {redirect} from "next/navigation";
import {hasMembershipRole} from "@/modules/identity/context";
import {assertMentorProjectRecoveryAccess} from "@/modules/projects/mentor-project-recovery-guard";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {mentorReviewOverviewSchema,mentorReviewOverviewHref} from "@/modules/projects/mentor-review-overview-model";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {getMentorDeliveryReviewOverview} from "@/modules/projects/mentor-review-overview-service";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { formatNumberIN } from "@/lib/safe-format";
import { istDateFormatter, istDateTimeFormatter } from "@/lib/format-date";
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
 if(!parsed.success){
 const recoveryContext=await getCurrentRequestContext();
 if(!hasMembershipRole(recoveryContext,"MENTOR"))redirect("/dashboard");
 await assertMentorProjectRecoveryAccess(recoveryContext,projectId);
 return  <section role="alert">
 <PageHeader title={"Invalid project review filters"} />
 <p className="text-sm text-body">The filter link is invalid or contains duplicate values. Clear it to return to this project’s delivery reviews.</p>
 <TextLink href={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"} className="inline-flex min-h-11 items-center">Clear invalid filters</TextLink>
 </section>;
 }
 const data=await getMentorDeliveryReviewOverview(await getCurrentRequestContext(),parsed.data);
 const filtered=data.query.status!=="ALL"||data.query.feedback!=="ALL"||data.query.version!==undefined;
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
 <PageHeader eyebrow="Mentor · Project" title="Delivery review overview"
 description={data.project.title+" · "+data.project.status}
 actions={<TextLink data-unskin="" href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"}
  className="inline-flex min-h-11 items-center text-sm md:min-h-9">
  Delivery workspace</TextLink>}/>
 <FilterBar title="Filters"><form method="get" action={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"} role="search" aria-label="Delivery review filters"
 className="grid min-w-0 items-end gap-[8px] border-b border-border pb-4 md:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto_auto]">
  <Label stack>Delivery status
   <Select name="status" defaultValue={data.query.status}
    className="min-h-11 md:min-h-9">
    {(["ALL","DRAFT","SUBMITTED","APPROVED","CHANGES_REQUESTED"] as const).map(status=>
     <option key={status} value={status}>{status.replaceAll("_"," ")}</option>)}
   </Select>
  </Label>
  <Label stack>Written feedback
   <Select name="feedback" defaultValue={data.query.feedback}
    className="min-h-11 md:min-h-9">
    <option value="ALL">Any</option>
    <option value="WITH">Recorded</option>
    <option value="WITHOUT">Not recorded</option>
   </Select>
  </Label>
  <Label stack>Exact delivery version
   <Input type="number" name="version" min={1} max={1000000}
    defaultValue={data.query.version??""}
    placeholder="All versions" className="min-h-11 md:min-h-9"/>
  </Label>
  <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9 xl:w-auto">
   Filter
  </Button>
  {filtered?<TextLink href={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"}
   className="inline-flex min-h-11 items-center text-sm">Clear</TextLink>:null}
 </form></FilterBar>
 <div className="flex flex-wrap items-center gap-3 text-sm">
  <TextLink data-unskin="" href={"/api/projects/"+encodeURIComponent(projectId)+"/mentor-delivery-review-export?"+
   new URLSearchParams({status:data.query.status,feedback:data.query.feedback,
    ...(data.query.version===undefined?{}:{version:String(data.query.version)})}).toString()}
   download className="inline-flex min-h-11 items-center text-sm md:min-h-9">
   Export filtered delivery review CSV (max 200)
  </TextLink>
  {data.total>200?<p role="status">CSV omits {data.total-200} versions beyond the cap.</p>:null}
 </div>
 <section className="min-w-0 border-b border-border pb-4">
 <Heading level={2} size="base" className="m-0 leading-6 text-[var(--lms-heading)]">Recorded review coverage on this page</Heading>
 <p className="mt-2 text-sm text-body leading-[22px]">{data.counts.reviewed} reviewed version{data.counts.reviewed===1?"":"s"};
 {" "}{data.counts.withFeedback} with written feedback.</p>
 <p className="mt-1 text-xs text-muted-foreground leading-5">
 Counts apply to the current page of registered delivery versions. Feedback is optional for approval
 and required when changes are requested. Missing records are not assumed complete.
 </p></section>
 <p className="text-sm text-body leading-[22px]">{formatNumberIN(data.total)} registered delivery version{data.total===1?"":"s"}</p>
 {data.items.length===0?<EmptyState title="No registered final delivery"
 description="There is no persisted final-delivery version for this authorized project. Nothing was submitted or reviewed here in the registered history." action={filtered?<TextLink href={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"} className="inline-flex min-h-11 items-center md:min-h-9">Clear</TextLink>:<TextLink href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"} className="inline-flex min-h-11 items-center md:min-h-9">Delivery workspace</TextLink>}/>
 :<ol className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(item=>
 <li key={item.id} className="py-[var(--lms-space-3)]">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <Heading level={2} size="base" className="m-0 leading-6 text-[var(--lms-heading)]">Delivery version {item.version}</Heading>
 <span className="text-xs font-semibold text-body">{item.status}</span></div>
 <p className="mt-2 text-sm text-body leading-[22px]">{item.reviewLabel}</p>
 <TextLink href={"/mentor/projects/"+encodeURIComponent(projectId)+
  "/deliveries/"+encodeURIComponent(item.id)+"/review"}
  className="mt-3 inline-flex min-h-11 items-center text-sm">
  View recorded review details
 </TextLink>
 <p className="mt-1 text-xs text-muted-foreground leading-5">
 {item.submittedAt?"Submitted "+istDateFormatter.format(item.submittedAt)+" IST":"No recorded submission"}
 </p>
 <p className="mt-1 text-xs text-muted-foreground leading-5">
 {item.reviewedAt?"Reviewed "+istDateTimeFormatter.format(item.reviewedAt)+" IST":"No recorded review instant"}
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
