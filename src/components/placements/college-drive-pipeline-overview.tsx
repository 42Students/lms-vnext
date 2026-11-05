import { and, eq, sql } from "drizzle-orm";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getDb } from "@/db/client";
import { collegeMemberships, placementApplications, placementApplicationScreenings, users } from "@/db/schema";
import { placementCollegeApplicationStages } from "@/db/schema/placement-college-application-stages";
import { can } from "@/modules/permissions/policy";
import { StatTile } from "@/components/ui/stat-tile";
import { Disclosure } from "@/components/ui/disclosure";
import type {getCollegeHiringFunnel} from "@/modules/placements/college-hiring-funnel-service";
import type {getCollegeDriveAttention} from "@/modules/placements/college-drive-attention-service";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
type Funnel=Awaited<ReturnType<typeof getCollegeHiringFunnel>>;
type Attention=Awaited<ReturnType<typeof getCollegeDriveAttention>>;
const stages=["APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED","WITHDRAWN"] as const;
const labels={APPLIED:"Applied",SHORTLISTED:"Shortlisted",ASSESSMENT:"Assessment",INTERVIEW:"Interview",WAITLISTED:"Waitlisted",OFFERED:"Offered",HIRED:"Hired",REJECTED:"Rejected",WITHDRAWN:"Withdrawn"} as const;
/** Legacy College Admin shows candidate-specific needs-attention before
 * the company card. Only the authorized current college's candidate rows
 * are linked, with counts from the scoped aggregate service. */
export async function CollegeDriveAttentionBanner({jobId,attention}:{
 jobId:string;attention:Attention;
}){
 const base="/college/placements/jobs/"+encodeURIComponent(jobId);
 const flags=attention.categories.filter(x=>x.jobId===jobId);
 const context=await getCurrentRequestContext();
 const membership=context.membership;
 // The legacy alert linked individual applicants. Resolve a bounded, college-
 // scoped roster at render time; category totals are still the untruncated
 // aggregate from the attention service.
 const candidates=flags.length && membership &&
   can(context,"placements.manage",{organizationId:membership.organizationId,collegeId:membership.collegeId})
   ? await getDb().select({
       id:placementApplications.id,
       name:users.displayName,
       submittedAt:placementApplications.submittedAt,
       stage:sql<string>`coalesce(${placementCollegeApplicationStages.stage},
         case when ${placementApplicationScreenings.status}='SHORTLISTED' then 'SHORTLISTED'
              when ${placementApplicationScreenings.status}='REJECTED' then 'REJECTED'
              else 'APPLIED' end)`,
       hasBookedSlot:sql<boolean>`exists (
         select 1 from placement_round_candidate_slots s
         where s.job_id=${placementApplications.jobId}
           and s.application_id=${placementApplications.id} and s.status='BOOKED')`,
       missingOfferLetter:sql<boolean>`exists (
         select 1 from placement_offers o where o.application_id=${placementApplications.id}
         and o.status in ('ISSUED','ACCEPTED')
         and (o.offer_letter_url is null or trim(o.offer_letter_url)=''))`,
     }).from(placementApplications)
       .innerJoin(collegeMemberships,and(
         eq(collegeMemberships.id,placementApplications.membershipId),
         eq(collegeMemberships.collegeId,membership.collegeId)))
       .innerJoin(users,eq(users.id,collegeMemberships.userId))
       .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
       .leftJoin(placementCollegeApplicationStages,eq(placementCollegeApplicationStages.applicationId,placementApplications.id))
       .where(and(eq(placementApplications.jobId,jobId),eq(placementApplications.status,"SUBMITTED")))
       .limit(500)
   : [];
 const flaggedCandidates=(category:string)=>candidates.filter(candidate=>
   category==="STALE_APPLIED"?candidate.stage==="APPLIED"&&candidate.submittedAt.getTime()<Date.now()-7*86400000:
   category==="INTERVIEW_UNSCHEDULED"?candidate.stage==="INTERVIEW"&&!candidate.hasBookedSlot:
   category==="MISSING_OFFER_LETTER"?candidate.missingOfferLetter:
   category==="LOW_CONVERSION"?candidate.stage==="APPLIED":false);
 const warningCount=flags.reduce((total,flag)=>total+flag.count,0);

 return <div className="min-w-0">{flags.length>0?<section aria-label="Drive needs attention" role="alert" className="rounded-[var(--lms-control-radius)] border border-[color:var(--lms-icon-amber)] bg-[color:var(--lms-gold-subtle)] px-4 py-3 text-[color:var(--lms-warning-strong)]">
    <Heading level={2} size="sm">⚠ Needs attention ({warningCount})</Heading>
    <ul className="mt-3 space-y-3">{flags.map(flag=>{
      const rows=flaggedCandidates(flag.category);
      const stage=flag.category==="STALE_APPLIED"||flag.category==="LOW_CONVERSION"?"APPLIED":
        flag.category==="INTERVIEW_UNSCHEDULED"?"INTERVIEW":"OFFERED";
      const title=flag.category==="STALE_APPLIED"?"Applications with no action in a week":
        flag.category==="INTERVIEW_UNSCHEDULED"?"Marked Interview, nothing scheduled":
        flag.category==="MISSING_OFFER_LETTER"?"Offer letter missing":"Closing soon, low conversion";
      return <li key={flag.category}>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <TextLink href={flag.href}>{title}</TextLink>
          <span className="rounded-full bg-[color:var(--lms-gold-subtle)] px-2 py-0.5 text-xs">{flag.count}</span>
        </div>
        {rows.length>0?<ul className="mt-1 space-y-1 pl-2">{rows.map(row=><li key={row.id}>
          <TextLink className="inline-flex min-h-11 items-center text-sm md:min-h-9"
            href={base+"/applications?stage="+stage+"&applicationId="+encodeURIComponent(row.id)}>
            {row.name||"Applicant"} — Review application →
          </TextLink>
        </li>)}</ul>:<TextLink href={flag.href} className="mt-1 inline-block text-sm">View matching applications →</TextLink>}
        {flag.count>rows.length?<p className="pl-2 text-xs">Showing {rows.length} of {flag.count} affected candidates. Open the filtered list for all.</p>:null}
      </li>;
    })}</ul>
    <Disclosure title="Evidence note" className="mt-[var(--lms-space-3)]"><p className="max-w-[75ch] pt-2 text-xs leading-5">Only registered private offer-letter records are used when checking evidence.</p></Disclosure>
  </section>:null}</div>;
}

export async function CollegeDrivePipelineOverview({jobId,data}:{
 jobId:string;data:Funnel;
}){
 const base="/college/placements/jobs/"+encodeURIComponent(jobId);

 return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <nav aria-label="Drive sections" role="tablist"
    className="flex min-w-0 flex-wrap gap-4 border-b border-border">
    {([
      ["Overview",base],
      ["Applications",base+"/applications"],
      ["Schedule",base+"/interviews"],
      ["Settings",base+"/settings"],
    ] as const).map(([label,href])=><TextLink variant="bare" key={href} href={href} role="tab"
      aria-selected={label==="Overview"} tabIndex={label==="Overview"?0:-1}
      className={"inline-flex min-h-11 items-center border-b-2 px-2 text-sm font-semibold focus-ring "+
       (label==="Overview"?"border-primary text-primary-text":"border-transparent text-body hover:text-primary-text")}>
      {label}
    </TextLink>)}
  </nav>

  <div className="flex min-w-0 flex-wrap items-center gap-3 border-b border-border pb-3" aria-label="Additional drive actions">
    <TextLink href={base+"/shortlisted"} className="inline-flex min-h-11 items-center md:min-h-9">
      View Shortlisted →
    </TextLink>
  </div>
  <section className="space-y-3" aria-label="College application pipeline">
   <Heading level={2} size="lg">Pipeline</Heading>
   <p className="text-xs text-muted-foreground leading-5">These are current registered College Admin application stages, not cumulative funnel conversions.</p>
   <div className="grid min-w-0 grid-cols-2 gap-[var(--lms-space-3)] md:grid-cols-3 xl:grid-cols-5">
    {stages.map(stage=><StatTile key={stage} href={base+"/applications?stage="+stage}
      label={labels[stage]} value={data.totals[stage]??0}>
      <span className="mt-2 block text-xs text-primary-text underline">View applications</span>
    </StatTile>)}
   </div>
  </section>

 </div>;
}
