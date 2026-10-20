"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
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
  await run(async()=>{setError("");
   try{
    await apiFetch("/api/admin/placements/jobs/"+encodeURIComponent(jobId)+"/delete",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({confirmed:true,expectedUpdatedAt:preview.expectedUpdatedAt,
      expectedImpact:preview.impact,reason:reason.trim()}),
    });
    router.push("/admin/placements/drives");router.refresh();
   }catch(e){setError(e instanceof Error?e.message:"Delete action failed. Refresh preview.");
    setPreview(null);}
  });
 }
 return <section className="space-y-3 border-b border-border pb-5">
  <h2 className="font-semibold">Delete drive</h2>
  <p className="text-sm text-body">Delete archives the drive and preserves its history.
   Learners are notified; scheduled interviews and unaccepted offers are cancelled.</p>
  {!preview?<Button type="button" variant="secondary" disabled={pending} onClick={()=>void inspect()}>
   Preview delete impact</Button>:
   <form onSubmit={e=>void confirm(e)} className="space-y-3">
    <p className="text-sm font-semibold">Delete {title}?</p>
    <dl className="grid grid-cols-2 gap-2 text-sm">
     {([["Active applications",preview.impact.activeApplications],
       ["Affected learners",preview.impact.affectedLearners],
       ["Interviews to cancel",preview.impact.openRounds],
       ["Issued offers to withdraw",preview.impact.issuedOffers],
       ["Accepted offers",preview.impact.acceptedOffers]] as const)
       .map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
    {preview.impact.acceptedOffers>0?<p role="alert" className="text-warning">
     Resolve accepted offers before deleting this drive.</p>:null}
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reason (required)
     <Textarea required minLength={10} maxLength={1000} value={reason}
      onChange={e=>setReason(e.target.value)} rows={2}
      className="w-full"/></label>
    <Button type="submit" variant="danger" disabled={pending||!preview.archivable||reason.trim().length<10}>
     {pending?"Deleting…":"Confirm delete (archive)"}</Button>
    <Button type="button" variant="secondary" className="ml-2" disabled={pending} onClick={()=>setPreview(null)}>Cancel</Button>
   </form>}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
