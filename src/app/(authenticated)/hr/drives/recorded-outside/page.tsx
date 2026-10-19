import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
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
 if(!collegeId)return <div className="min-w-0 max-w-full space-y-4">
  <PageHeader eyebrow="Recruiter · Drive creation" title="Choose a college for the external drive"/>
  {context.recruiter.grants.map(g=><Link key={g.id}
   href={"/hr/drives/recorded-outside?collegeId="+g.collegeId}
   className="block min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm font-medium text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">{g.collegeName}</Link>)}
 </div>;
 if(!z.string().uuid().safeParse(collegeId).success||!context.recruiter.grants.some(g=>g.collegeId===collegeId))notFound();
 const result=await recordedOutsideChoices(context,collegeId);
 const savedId=q.saved;
 const saved=savedId?await verifyRecordedOutsideConfirmation(context,collegeId,savedId):false;
 return <div className="min-w-0 max-w-full space-y-5">
  <PageHeader eyebrow="Recruiter · Drive creation" title="Record an outside-platform drive"
   description="Historical employer-college record only. This cannot publish a student-visible job."/>
  <Link href={"/hr/drives/new?collegeId="+collegeId} className="inline-flex min-h-9 items-center text-sm font-medium text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Back to drive request</Link>
  {saved?<p role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-primary-subtle p-3 text-sm text-body">External drive record saved. It was not published as a job.</p>:null}
  <RecordedOutsideForm collegeId={collegeId} choices={result.choices}/>
 </div>;
}
