"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {Button} from "@/components/ui/button";
type Preview={job:{title:string;status:string};canArchive:boolean;applications:number;
 rounds:number;offers:Record<string,number>;note:string};
export function CollegeDriveArchiveAction({jobId}:{jobId:string}){
 const router=useRouter();
 const [preview,setPreview]=useState<Preview|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [awaitingConfirmation,setAwaitingConfirmation]=useState(false);
 const url="/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/archive";
 async function load(){
  setBusy(true);setError("");
  try{const body=await apiFetch<Preview>(url,{cache:"no-store"});
   if(!body?.job)throw Error("Impact preview unavailable");
   setPreview(body);setAwaitingConfirmation(false);
  }catch(e){setError(e instanceof Error?e.message:friendlyApiError({}));}
  finally{setBusy(false);}
 }
 async function archive(){
  if(!preview?.canArchive||busy)return;
  if(!awaitingConfirmation)return;
  setBusy(true);setError("");
  try{
   await apiFetch(url,{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({confirmed:true})});
   // Confirm the archive explicitly before navigating. The record is retained,
   // so the old "Drive deleted" success wording would be misleading.
   window.alert("Drive archived");
   router.push("/college/placements/drives?status=ARCHIVED");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:friendlyApiError({}));}
  finally{setBusy(false);}
 }
 return <div className="min-w-0 space-y-[var(--lms-space-3)] bg-transparent pb-[var(--lms-space-4)]">
  <h2 className="sr-only">Delete drive</h2>
  <p className="text-sm text-muted-foreground">Safely archive instead of permanently erasing placement evidence.</p>
  {!preview?<Button variant="secondary" type="button" disabled={busy} onClick={()=>void load()} className="min-h-11 w-full md:w-auto md:min-h-9">
    {busy?"Loading…":"View delete impact"}</Button>:
   <div className="space-y-2" role="group" aria-label="Delete drive impact">
    <p className="text-sm font-semibold">{preview.job.title} · {preview.job.status}</p>
    <p className="text-sm">{preview.applications} applications, {preview.rounds} rounds,
     {Object.values(preview.offers).reduce((sum,n)=>sum+n,0)} offers will remain in history.</p>
    <p className="text-sm">{preview.note}</p>
    {awaitingConfirmation?<p role="alert" className="rounded-md border border-border bg-muted p-3 text-sm">
      Archive &quot;{preview.job.title}&quot;? The drive stays in the audit history.
    </p>:null}
    <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] md:flex-row md:flex-wrap">
     {awaitingConfirmation?<Button type="button" disabled={busy||!preview.canArchive} onClick={()=>void archive()} className="min-h-11 w-full md:w-auto md:min-h-9">
       {busy?"Archiving…":"Yes, archive drive"}</Button>:
      <Button variant="secondary" type="button" disabled={busy||!preview.canArchive} onClick={()=>setAwaitingConfirmation(true)} className="min-h-11 w-full md:w-auto md:min-h-9">Archive drive</Button>}
     <Button variant="secondary" type="button" disabled={busy} onClick={()=>{setAwaitingConfirmation(false);setPreview(null);}} className="min-h-11 w-full md:w-auto md:min-h-9">Cancel</Button>
    </div>
   </div>}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </div>;
}
