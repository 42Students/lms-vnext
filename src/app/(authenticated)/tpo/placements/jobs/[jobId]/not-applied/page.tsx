import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {Alert} from "@/components/ui/alert";
import {listTpoEligibleNonApplicants,getTpoNonApplicantReminderPreview} from "@/modules/placements/tpo-remind-not-applied-service";
import {TpoNonApplicantActions} from "@/components/tpo/tpo-non-applicant-actions";

export const dynamic="force-dynamic";
export default async function TpoRegisteredNonApplicants({
 params,searchParams,
}:{params:Promise<{jobId:string}>;searchParams:Promise<{page?:string|string[]}>}){
 const ctx=await getCurrentRequestContext();
 if(!ctx.membership||!hasMembershipRole(ctx,"TPO"))redirect("/dashboard");
 const {jobId}=await params;
 const raw=await searchParams;
 if(typeof raw.page!=="undefined"&&
  (Array.isArray(raw.page)||!/^[1-9][0-9]{0,4}$/.test(raw.page)))notFound();
 const page=raw.page?Number(raw.page):1;
 const [result,reminder]=await Promise.all([
  listTpoEligibleNonApplicants(ctx,jobId,page),
  getTpoNonApplicantReminderPreview(ctx,jobId),
 ]);
 const base="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 return <div className="min-w-0 space-y-5">
  <PageHeader title="Registered, not applied"
   description={"Registered, eligible students who have not submitted an application for "+result.jobTitle+"."}
   actions={<Link href={base+"/applicants-pipeline"} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
    ← Applicants
   </Link>}/>
  <Alert tone="info">This list is independent of the submitted-applicant filters. No unauthorized learner profile or email is shown. The server checks current eligibility again before any addition or reminder.</Alert>
  <TpoNonApplicantActions jobId={jobId} roles={result.roles}
   students={result.students} canAdd={result.canAdd}
   reminder={{previewToken:reminder.previewToken,count:reminder.count,
    allowed:reminder.allowed,alreadySent:reminder.alreadySent}}/>
  {!result.students.length?<EmptyState title="No registered, eligible students awaiting an application"
   description="Every currently eligible registered student has applied, or none are available for this page."/>:null}
  <nav aria-label="Non-applicant pages" className="flex flex-wrap items-center justify-between gap-3">
   {page>1?<Link href={base+"/not-applied?page="+(page-1)} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">← Previous</Link>:<span/>}
   <span className="text-sm text-body">Page {page} · {result.total} eligible non-applicants</span>
   {result.hasMore?<Link href={base+"/not-applied?page="+(page+1)} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Next →</Link>:null}
  </nav>
 </div>;
}
