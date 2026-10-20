import {DataTable} from "@/components/ui/data-table";
import {EmptyState} from "@/components/ui/empty-state";
import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoDriveAbout} from "@/modules/placements/tpo-drive-about-service";
export const dynamic="force-dynamic";
const format=(value:number|null)=>value===null?"Not recorded":"₹"+(value/100000).toLocaleString("en-IN")+" LPA";
const when=(value:string|null)=>value?new Intl.DateTimeFormat("en-IN",{
 dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(value))+" IST":"Not recorded";
export default async function AboutDrivePage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId}=await params;
 let data:Awaited<ReturnType<typeof getTpoDriveAbout>>;
 try{data=await getTpoDriveAbout(context,jobId);}
 catch(e){if(e instanceof PlacementsServiceError&&e.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw e;}
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 const rules=[
  ["Minimum CGPA",data.policy.minCgpa],
  ["Maximum active backlogs",data.policy.maxActiveBacklogs],
  ["Maximum past backlogs",data.policy.maxPastBacklogs],
  ["10th percentage",data.policy.minTenthPercentage],
  ["12th percentage",data.policy.minTwelfthPercentage],
  ["Diploma percentage",data.policy.minDiplomaPercentage],
  ["Undergraduate percentage",data.policy.minUndergraduatePercentage],
  ["Percentage throughout",data.policy.minPctThroughout],
  ["Maximum gap years",data.policy.maxGapYears],
  ["Passing years",data.policy.allowedPassingYears.join(", ")||null],
  ["Missing evidence",data.policy.missingEvidencePolicy.replaceAll("_"," ")],
  ["Verified marks only",data.policy.requireVerifiedEvidence?"Yes":"No"],
 ] as const;
 return <div className="min-w-0 space-y-[var(--lms-space-6)]">
  <PageHeader eyebrow="TPO · Drive workspace" title={data.job.title+" · About this drive"}
   description="Eligibility, reach, packages, employer details, closed summary and the most recent audit activity."/>
  <nav aria-label="Drive details sections" className="flex min-w-0 flex-wrap gap-[var(--lms-space-4)] text-sm font-semibold">
   <Link className="inline-flex min-h-11 items-center text-[var(--lms-link-text)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)]" href={root+"/applicants-pipeline"}>Applicants</Link>
   <Link className="inline-flex min-h-11 items-center text-[var(--lms-link-text)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)]" href={root+"/selections"}>Selections</Link>
   <Link className="inline-flex min-h-11 items-center text-[var(--lms-link-text)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)]" href={root+"/change-requests"}>Company change requests</Link>
  </nav>
  <section className="border-b border-border pb-6">
   <h2 className="text-lg font-semibold">Eligibility and reach</h2>
   <p className="mt-2 text-2xl font-semibold tabular-nums">{data.reach.eligible} students meet the current notification and eligibility rules</p>
   <p className="mt-1 text-sm text-body">{data.reach.excluded} excluded or not notified, out of {data.reach.considered} registered learners considered. Counts come from current registration, opt-in, debarment and academic evidence.</p>
   <div className="mt-4">
    <DataTable caption="Eligible and applied learners by branch"
     rows={data.byBranch} getRowKey={row=>row.branch}
     empty={<EmptyState title="No active academic branch enrollments are recorded."/>}
     columns={[
      {key:"branch",header:"Branch",mobileLabel:"Branch",mobilePriority:"primary",cell:row=>row.branch},
      {key:"eligible",header:"Eligible",mobileLabel:"Eligible",mobilePriority:"secondary",cell:row=>row.eligible},
      {key:"applied",header:"Applied",mobileLabel:"Applied",mobilePriority:"secondary",cell:row=>row.applied},
     ]}/>
   </div>
  </section>
  <section className="border-b border-border pb-6">
   <h2 className="font-semibold">Why learners were excluded</h2>
   <p className="mt-2 text-sm text-body">Up to 100 excluded registered learners shown; eligibility details may change as academic records are verified.</p>
   <ul className="mt-3 divide-y divide-border text-sm">{data.excluded.map((row,i)=>
    <li key={row.name+":"+i} className="py-3">
     <strong>{row.name}</strong> · {row.reason}</li>)}</ul>
   {data.totalExcludedDetail>data.excluded.length?<p className="mt-2 text-sm text-body">
    {data.totalExcludedDetail-data.excluded.length} additional excluded learners not shown.</p>:null}
   {!data.excluded.length?<EmptyState title="No excluded registered learner details were found."/>:null}
  </section>
  <section className="border-b border-border pb-6">
   <h2 className="font-semibold">Eligibility rules</h2>
   <dl className="mt-3 grid min-w-0 gap-3 min-[768px]:grid-cols-2 lg:grid-cols-3">
    {rules.map(([label,value])=><div key={label} className="border-b border-border pb-3 text-sm">
     <dt className="text-body">{label}</dt><dd className="font-semibold">{value===null?"Not restricted":value}</dd></div>)}
   </dl>
   <p className="mt-3 text-sm text-body">{data.policy.allowedProgramIds.length} program(s), {data.policy.allowedCohortIds.length} cohort(s), {data.policy.allowedSectionIds.length} section(s) explicitly targeted.</p>
  </section>
  <section className="border-b border-border pb-6">
   <h2 className="font-semibold">Drive details and employer</h2>
   <dl className="mt-3 grid min-w-0 gap-3 min-[768px]:grid-cols-2 lg:grid-cols-3 text-sm">
    {[
     ["Company",data.job.company],["Status",data.job.status],["Placement season",data.job.season],
     ["Job type",data.job.employmentType],["Work mode",data.job.workMode],
     ["Application mode",data.job.applicationMode],["Locations",data.job.locations.join(", ")||"Not recorded"],
     ["Openings",data.job.openings??"Not recorded"],["Application deadline",when(data.job.applicationDeadline)],
     ["Minimum CTC",format(data.job.minimumAnnualCtcInr)],["Maximum CTC",format(data.job.maximumAnnualCtcInr)],
     ["Dream drive",data.job.isDream?"Yes":"No"],
     ["Fixed CTC (LPA)",data.job.fixedCtcLpa??"Not recorded"],
     ["Variable CTC (LPA)",data.job.variableCtcLpa??"Not recorded"],
     ["Stipend per month",data.job.stipendPerMonthInr!==null?"₹"+data.job.stipendPerMonthInr.toLocaleString("en-IN"):"Not recorded"],
    ].map(([label,value])=><div key={String(label)}><dt className="text-body">{label}</dt><dd className="font-semibold">{value}</dd></div>)}
   </dl>
   <p className="mt-4 whitespace-pre-wrap text-sm text-body">{data.job.description}</p>
   <h3 className="mt-4 font-semibold">Recruiter contacts</h3>
   {data.recruiterContacts.length?<ul className="mt-2 list-disc pl-5 text-sm">{data.recruiterContacts.map(email=><li key={email}>{email}</li>)}</ul>:
    <EmptyState title="No current recruiter email is recorded for this company relationship."/>}
   <div className="mt-4">
    <h3 className="font-semibold">Related company requests</h3>
    {data.previousRequests.length?<ul className="mt-2 divide-y divide-border text-sm">
      {data.previousRequests.map(request=><li key={request.id} className="py-3">
       <Link className="font-semibold text-[var(--lms-teal-deep)] underline"
         href={"/tpo/placements/requests?requestId="+encodeURIComponent(request.id)}>
         {request.proposedTitle??"Recruiter drive request"}</Link>
       <span className="ml-2 text-body">{request.status} · {when(request.createdAt)}</span>
       {request.decisionNote?<p className="text-body">Decision: {request.decisionNote}</p>:null}
      </li>)}
    </ul>:<EmptyState title="No recruiter request is linked to this drive."/>}
   </div>
  </section>
  <section className="border-b border-border pb-6">
   <h2 className="font-semibold">Role packages</h2>
   <div className="mt-3">
    <DataTable caption="Role packages and compensation" rows={data.packages} getRowKey={pkg=>pkg.id}
     empty={<EmptyState title="No role packages are recorded for this drive."/>}
     columns={[
      {key:"role",header:"Role",mobileLabel:"Role",mobilePriority:"primary",cell:pkg=>pkg.title},
      {key:"ctc",header:"CTC range",mobileLabel:"CTC range",mobilePriority:"secondary",
       cell:pkg=>format(pkg.minimumAnnualCtcInr)+" – "+format(pkg.maximumAnnualCtcInr)},
      {key:"details",header:"Fixed / variable / bonus (LPA)",mobileLabel:"Fixed / variable / bonus (LPA)",mobilePriority:"secondary",
       cell:pkg=>(pkg.fixedLpa??"—")+" / "+(pkg.variableLpa??"—")+" / "+(pkg.joiningBonusLpa??"—")},
     ]}/>
   </div>
  </section>
  {["CLOSED","CANCELLED"].includes(data.job.status)?<section className="border-b border-border pb-6">
   <h2 className="font-semibold">Closed drive summary</h2>
   <p className="mt-2 text-sm">{data.closeSummary.applications} recorded applications · {data.closeSummary.offers} offer versions.</p>
   <Link className="mt-2 inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] underline md:min-h-9" href={root+"/closeout"}>See the close-out report</Link>
  </section>:null}
  <section id="activity" aria-label="Drive activity" className="scroll-mt-24 border-b border-border pb-6">
   <h2 className="font-semibold">Recent activity · last {data.feed.length} (maximum 100)</h2>
   {!data.feed.length?<EmptyState title="No placement activity recorded for this drive."/>:
   <ol className="mt-3 divide-y divide-border">{data.feed.map(event=><li key={event.id} className="py-3 text-sm">
    <span className="font-semibold">{event.summary}</span>
    <time className="ml-2 text-body" dateTime={event.occurredAt}>{when(event.occurredAt)}</time>
   </li>)}</ol>}
  </section>
 </div>;
}
