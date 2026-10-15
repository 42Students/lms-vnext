import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {RecordedOutsideForm} from "@/components/placements/recorded-outside-form";
import {recordedOutsideChoices} from "@/modules/placements/recorded-outside-service";
export default async function HrRecordedOutsidePage({searchParams}:{
 searchParams:Promise<{collegeId?:string|string[];saved?:string|string[]}>;
}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context)||!context.recruiter)redirect("/dashboard");
 const q=await searchParams;
 const raw=Array.isArray(q.collegeId)?q.collegeId[0]:q.collegeId;
 const collegeId=raw??(context.recruiter.grants.length===1?context.recruiter.grants[0]?.collegeId:undefined);
 if(!collegeId)return <main className="space-y-4">
  <PageHeader eyebrow="Recruiter · Drive creation" title="Choose a college for the external drive"/>
  {context.recruiter.grants.map(g=><Link key={g.id}
   href={"/hr/drives/recorded-outside?collegeId="+g.collegeId}
   className="block min-h-11 rounded-md border border-border p-3 text-primary-text">{g.collegeName}</Link>)}
 </main>;
 if(!z.string().uuid().safeParse(collegeId).success||!context.recruiter.grants.some(g=>g.collegeId===collegeId))notFound();
 const result=await recordedOutsideChoices(context,collegeId);
 return <main className="space-y-5">
  <PageHeader eyebrow="Recruiter · Drive creation" title="Record an outside-platform drive"
   description="Historical employer-college record only. This cannot publish a student-visible job."/>
  <Link href={"/hr/drives/new?collegeId="+collegeId} className="inline-flex min-h-11 items-center text-primary-text">Back to drive request</Link>
  {q.saved?<p role="status" className="rounded-md border border-border p-3 text-sm text-body">External drive record saved. It was not published as a job.</p>:null}
  <RecordedOutsideForm collegeId={collegeId} choices={result.choices} registered={result.status==="READY"}/>
 </main>;
}
