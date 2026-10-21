import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {TpoApplicantReviewForm} from "@/components/placements/tpo-applicant-review-form";
import {canReviewApplicant} from "@/modules/placements/tpo-applicant-review-model";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoApplicantDetail} from "@/modules/placements/tpo-applicant-detail-service";
import {listTpoApplicantNotes} from "@/modules/placements/applicant-notes-service";
import {ApplicantNotesPanel} from "@/components/placements/applicant-notes-panel";
type Params={params:Promise<{jobId:string;applicationId:string}>};
export default async function TpoApplicantDetailPage({params}:Params){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId,applicationId}=await params;
 let data:Awaited<ReturnType<typeof getTpoApplicantDetail>>;
 try{data=await getTpoApplicantDetail(context,{jobId,applicationId});}catch(error){
  if(error instanceof PlacementsServiceError&&
    (error.code==="PLACEMENT_JOB_NOT_FOUND"||error.code==="PLACEMENT_APPLICATION_NOT_FOUND"))notFound();
  throw error;
 }
 const notes=await listTpoApplicantNotes(context,jobId,applicationId);
 const applicationFields:ReadonlyArray<readonly [string,string|null|undefined]>=[["Application",data.applicantStatus],["Screening",data.screening],
     ["Channel",data.application.channel],["Eligibility",data.application.eligibilityStatus],
     ["Submitted",new Date(data.application.submittedAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"})+" IST"],
     ["Screening decided",data.application.screeningDecidedAt?
      new Date(data.application.screeningDecidedAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"})+" IST":"Not recorded"]];
 return <div className="min-w-0 space-y-6">
  <div id="applicant-detail" tabIndex={-1} className="scroll-mt-24 rounded-[var(--lms-control-radius)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)]">
  <PageHeader eyebrow="TPO · Applicant detail"
   title={data.application.student??"Name not recorded"}
   description={data.job.title+" · "+data.application.roleTitle}
   actions={<Link href={"/tpo/placements/jobs/"+jobId+"/applicants-pipeline"} className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-[var(--lms-link-text)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-[var(--lms-control-height)] min-[768px]:w-auto">← Applicant pipeline</Link>}/>
  </div>
  <section className="border-b border-border pb-6">
   <h2 className="font-semibold text-foreground">Application and screening</h2>
   <dl className="mt-3 grid min-w-0 grid-cols-1 gap-x-6 min-[768px]:grid-cols-2">
    {applicationFields.map(([label,value])=><div key={label} className="min-w-0 border-b border-border py-3">
       <dt className="text-xs font-semibold text-body">{label}</dt>
       <dd className="mt-1 break-words text-sm text-foreground">{value}</dd>
      </div>)}
   </dl>
   <Link href={"/tpo/students/"+data.application.membershipId+"/history"}
    className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9">
    View student placement history →</Link>
  </section>
  {data.application.screeningUpdatedAt && canReviewApplicant(data.applicantStatus, data.screening) ?
   <TpoApplicantReviewForm jobId={jobId} applicationId={applicationId}
     expectedUpdatedAt={data.application.screeningUpdatedAt}/> : null}
  <ApplicantNotesPanel endpoint={"/api/placements/tpo/jobs/"+jobId+"/applicants/"+applicationId+"/notes"}
   snapshot={notes} audience="the college placement cell (TPO)"/>
  <details className="border-b border-border pb-6">
   <summary className="min-h-11 cursor-pointer list-none py-2 font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] [&::-webkit-details-marker]:hidden">Applied round outcomes <span aria-hidden="true" className="ml-2 text-primary-text">⌄</span></summary>
   {data.resultsTruncated?<Alert tone="warning">Only 100 applied result versions examined.</Alert>:null}
   {data.appliedRoundResults.length===0?<EmptyState title="No applied round outcomes recorded for this application."/>:
    <div className="mt-3 grid gap-3">{data.appliedRoundResults.map(r=>
     <article key={r.roundId} className="min-w-0 border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]">
      <h3 className="font-semibold text-foreground">{r.roundName}</h3>
      <p className="mt-1 text-sm text-body">{r.kind} · {r.outcome} · Applied: {r.appliedAt?
       new Date(r.appliedAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}):"Time not recorded"}</p>
     </article>)}</div>}
  </details>
  <details className="border-b border-border pb-6">
   <summary className="min-h-11 cursor-pointer list-none py-2 font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] [&::-webkit-details-marker]:hidden">Offer and joining evidence <span aria-hidden="true" className="ml-2 text-primary-text">⌄</span></summary>
   {data.offersTruncated?<Alert tone="warning">Only the latest 100 offer versions examined.</Alert>:null}
   {data.offers.length===0?<EmptyState title="No persisted offer versions for this application."/>:
    <div className="mt-3 grid gap-3">{data.offers.map(offer=>
     <article key={offer.offerId} className="min-w-0 border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]">
      <h3 className="font-semibold text-foreground">{offer.roleTitle} · Version {offer.version}</h3>
      <p className="mt-1 text-sm text-body">{offer.status} · Joining: {offer.joiningStatus??"Not confirmed"}
       {" · "}Annual CTC: {offer.annualCtcInr===null?"Not recorded":"₹"+offer.annualCtcInr.toLocaleString("en-IN")}</p>
      <p className="mt-1 text-xs text-body">Issued: {new Date(offer.issuedAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"})} IST</p>
     </article>)}</div>}
  </details>
  <p className="text-xs text-body">This view uses only recorded application, screening, APPLIED results and offer/joining states. Internal screening comments and staged round outcomes are not disclosed. Employer-final selection is not independently recorded.</p>
 </div>;
}
