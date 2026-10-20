import {PageBackLink} from "@/components/ui/page-back-link";
import {redirect,notFound} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
import {EmptyState} from "@/components/ui/empty-state";
import {InlineNotice} from "@/components/ui/inline-notice";
import {RecordedOutsideForm} from "@/components/placements/recorded-outside-form";
import {recordedOutsideChoices,verifyRecordedOutsideConfirmation} from "@/modules/placements/recorded-outside-service";
export default async function HrRecordedOutsidePage({searchParams}:{
 searchParams:Promise<{collegeId?:string|string[];saved?:string|string[]}>;
}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context)||!context.recruiter||context.recruiter.userId!==context.user.id)redirect("/dashboard");
 const q=await searchParams;
 // HR-RECORDED-QUERY-51: duplicate keys must not silently choose the first
 // college or saved request supplied by a crafted link.
 if(Array.isArray(q.collegeId)||Array.isArray(q.saved))notFound();
 const raw=q.collegeId;
 const collegeId=raw??(context.recruiter.grants.length===1?context.recruiter.grants[0]?.collegeId:undefined);
 if(!collegeId)return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageHeader title="Choose a college for the external drive"/>
  {context.recruiter.grants.length?<NeedsDoingChips label="Authorized colleges:" items={context.recruiter.grants.map(g=>({
   key:g.collegeId,label:g.collegeName,
   href:"/hr/drives/recorded-outside?collegeId="+encodeURIComponent(g.collegeId),
  }))}/>:<EmptyState title="No active college access" description="Your placement-cell relationship must be active to record an external drive."/>}
 </div>;
 if(!z.string().uuid().safeParse(collegeId).success||!context.recruiter.grants.some(g=>g.collegeId===collegeId))notFound();
 const result=await recordedOutsideChoices(context,collegeId);
 const savedId=q.saved;
 const saved=savedId?await verifyRecordedOutsideConfirmation(context,collegeId,savedId):false;
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageHeader title="Record an outside-platform drive"
   description="Historical employer-college record only. This cannot publish a student-visible job."
   actions={<PageBackLink href={"/hr/drives/new?collegeId="+collegeId} label="Back to drive request"/>}/>
  {saved?<InlineNotice tone="success" message="External drive record saved. It was not published as a job."/>:null}
  <RecordedOutsideForm collegeId={collegeId} choices={result.choices}/>
 </div>;
}
