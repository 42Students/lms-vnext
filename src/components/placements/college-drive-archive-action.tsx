"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
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
   setAwaitingConfirmation(false);
   router.push("/college/placements/drives?status=ARCHIVED");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:friendlyApiError({}));}
  finally{setBusy(false);}
 }
 return <section aria-labelledby="drive-archive-heading"
  className="min-w-0 space-y-[var(--lms-space-3)] border-l-4 border-[var(--lms-error)] bg-[var(--lms-neutral-50)] px-4 py-4">
  <h2 id="drive-archive-heading" className="flex items-center gap-2 text-base font-semibold text-[var(--lms-error)]">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>
    </svg>Archive drive
  </h2>
  <p className="text-sm text-muted-foreground">Safely archive instead of permanently erasing placement evidence.</p>
  {!preview?<Button variant="secondary" type="button" disabled={busy} onClick={()=>void load()} className="min-h-11 w-full md:w-auto md:min-h-9">
    {busy?"Loading…":"Review archive impact"}</Button>:
   <div className="space-y-2" role="group" aria-label="Archive drive impact">
    <p className="text-sm font-semibold">{preview.job.title} · {preview.job.status}</p>
    <p role="alert" className="text-sm font-medium text-[var(--lms-error)]">{preview.applications} applicants with applications, {preview.rounds} rounds,
     {Object.values(preview.offers).reduce((sum,n)=>sum+n,0)} offers will remain in history.</p>
    <p className="text-sm">{preview.note}</p>
    <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] md:flex-row md:flex-wrap">
      <Button variant="secondary" type="button" disabled={busy||!preview.canArchive}
        onClick={()=>setAwaitingConfirmation(true)}
        className="min-h-11 w-full border-[var(--lms-error)] text-[var(--lms-error)] md:w-auto md:min-h-9">
        Archive drive
      </Button>
      <Button variant="secondary" type="button" disabled={busy}
        onClick={()=>{setAwaitingConfirmation(false);setPreview(null);}}
        className="min-h-11 w-full md:w-auto md:min-h-9">Cancel</Button>
    </div>
   </div>}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <ConfirmDialog open={awaitingConfirmation}
    onOpenChange={next=>{if(!busy)setAwaitingConfirmation(next);}}
    title="Archive this drive?"
    description={preview? `Archive "${preview.job.title}"? ${preview.applications} applicant applications, ${preview.rounds} rounds and offer history remain available for audit. The drive will no longer be active.` :
      "The drive will no longer be active. Historical records are retained."}
    confirmLabel="Yes, archive drive" confirmVariant="danger" pending={busy}
    onConfirm={()=>void archive()}/>
 </section>;
}
