"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {beginDriveMutation,endDriveMutation} from "@/modules/placements/drive-mutation-client-lock";
import { Heading } from "@/components/ui/heading";
type Impact={activeApplications:number;affectedLearners:number;openRounds:number;
 issuedOffers:number;acceptedOffers:number};
type Preview={jobId:string;title:string;status:string;expectedUpdatedAt:string;
 impact:Impact;archivable:boolean};
export function SuperAdminDriveArchive({jobId,title}:{jobId:string;title:string}){
 const router=useRouter(),[preview,setPreview]=useState<Preview|null>(null),
  [reason,setReason]=useState(""),[error,setError]=useState("");
 const {pending,run}=useGuardedAction();
 async function inspect(){
  await run(async()=>{setError("");
   try{setPreview(await apiFetch<Preview>("/api/admin/placements/jobs/"+
    encodeURIComponent(jobId)+"/delete"));}
   catch(e){setError(e instanceof Error?e.message:"Preview unavailable. Retry.");}
  });
 }
 async function confirm(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!preview||!preview.archivable||reason.trim().length<10)return;
  if(!beginDriveMutation(jobId)){
   setError("Another action is changing this drive. Retry after it finishes.");return;
  }
  try{await run(async()=>{setError("");
   try{
    await apiFetch("/api/admin/placements/jobs/"+encodeURIComponent(jobId)+"/delete",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({confirmed:true,expectedUpdatedAt:preview.expectedUpdatedAt,
      expectedImpact:preview.impact,reason:reason.trim()}),
    });
    // The directory rejects unknown query parameters such as archived=1.
    // Return to the canonical Jobs Management list, like legacy /superadmin/jobs.
    router.push("/admin/placements/drives");router.refresh();
   }catch(e){
    // Preserve the impact dialog and its entered reason. An unsuccessful
    // mutation does not confirm a deletion; the operator can refresh the
    // server-owned preview/version token and retry without reopening the row.
    setError(e instanceof Error?e.message:"Delete action failed. Refresh preview.");
   }
  });}finally{endDriveMutation(jobId);}
 }
 return <section aria-labelledby="super-admin-drive-danger-title" className="min-w-0 space-y-[var(--lms-space-3)] rounded-[var(--lms-control-radius)] border border-[color:var(--lms-error-surface)] bg-[color:var(--lms-error-surface)] p-[var(--lms-space-4)]">
  <Heading level={2} size="base" id="super-admin-drive-danger-title" className="leading-[26px] md:text-[18px] md:leading-7 lg:text-[20px] lg:leading-[30px] text-[color:var(--lms-error-text)]">Danger zone · Delete drive</Heading>
  <p className="text-sm leading-[22px] text-[color:var(--lms-error-strong)]">This action archives the drive, rather than permanently deleting its applicant records.
   Application history is retained. Scheduled interviews and unaccepted offers are cancelled,
   and affected learners are notified by the registered in-app notice flow.</p>
  <p className="text-xs text-[color:var(--lms-error-strong)]">Unlike the old LMS Delete action, this operation preserves the listing as archived
   and may notify learners. Preview its exact impact before confirming.</p>
  {!preview?<Button type="button" variant="danger" disabled={pending} onClick={()=>void inspect()}>
   Preview delete impact</Button>:
   <form onSubmit={e=>void confirm(e)} className="space-y-3"
    aria-label={"Delete "+title+" confirmation"}>
    <p role="alert" className="text-sm font-semibold leading-[22px] text-[color:var(--lms-error-text)]">
     Delete &apos;{title}&apos;?
    </p>
    <p className="text-sm text-body">
     Confirming archives this drive and preserves its applicant history.
     Review the applicant and offer impact below before deleting.
    </p>
    <dl className="grid min-w-0 grid-cols-2 gap-[var(--lms-space-3)] text-sm">
     {([["Active applications",preview.impact.activeApplications],
       ["Affected learners",preview.impact.affectedLearners],
       ["Interviews to cancel",preview.impact.openRounds],
       ["Issued offers to withdraw",preview.impact.issuedOffers],
       ["Accepted offers",preview.impact.acceptedOffers]] as const)
       .map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
    {preview.impact.acceptedOffers>0?<p role="alert" className="text-warning">
     Resolve accepted offers before deleting this drive.</p>:null}
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reason (required)
     <Textarea required minLength={10} maxLength={1000} value={reason}
      onChange={e=>setReason(e.target.value)} rows={2}
      className="w-full"/></label>
    <div className="flex flex-wrap gap-2">
     <Button type="button" variant="secondary" disabled={pending}
      onClick={()=>void inspect()}>Refresh impact preview</Button>
     <Button type="submit" variant="danger"
      disabled={pending||!preview.archivable||reason.trim().length<10}>
      {pending?"Deleting…":"Delete (archive)"}
     </Button>
     <Button type="button" variant="secondary" disabled={pending}
      onClick={()=>{setPreview(null);setReason("");setError("");}}>Cancel</Button>
    </div>
   </form>}
  {error?<p role="alert" className="text-sm text-error leading-[22px]">
   Applicant impact could not be verified or the delete failed: {error}
   The job editor remains available; no delete is confirmed until the server succeeds.
  </p>:null}
 </section>;
}
