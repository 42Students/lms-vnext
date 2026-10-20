"use client";
import { Textarea } from "@/components/ui/textarea";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
type Preview={id:string;expectedUpdatedAt:string;counts:{applications:number;rounds:number;offers:number}};
export function TpoDriveClosePreviewForm({preview}:{preview:Preview}){
 const router=useRouter(),[pending,setPending]=useState(false),[error,setError]=useState<string|null>(null);
 const {run}=useGuardedAction({timeoutMs:40000});
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [confirmedReason,setConfirmedReason]=useState("");
 const [reasonText,setReasonText]=useState("");
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending)return;
  const reason=String(new FormData(event.currentTarget).get("reason")??"").trim();
  if(reason.length<10){setError("Reason for closure must be at least 10 characters.");return;}
  setConfirmedReason(reason);setConfirmOpen(true);
 }
 async function performClose(){
  if(pending||!confirmedReason)return;
  try{
   await run(async()=>{
    setPending(true);setError(null);
    try{
      await apiFetch("/api/placements/tpo/jobs/"+encodeURIComponent(preview.id)+"/close-preview",{
        method:"POST",credentials:"same-origin",timeoutMs:35000,
        headers:{"content-type":"application/json"},
        body:JSON.stringify({action:"CLOSE",confirmed:true,
          expectedUpdatedAt:preview.expectedUpdatedAt,
          expectedCounts:preview.counts,reason:confirmedReason}),
      });
      router.push("/tpo/placements/jobs/"+encodeURIComponent(preview.id));
      router.refresh();
    }catch(error){
      setConfirmOpen(false);
      // apiFetch maps HTML, network, provider and timeout failures to safe text.
      setError(error instanceof Error?error.message:friendlyApiError({}));
    }finally{setPending(false);}
   });
  }catch(error){
   // The outer guarded deadline can reject even if the request is still pending.
   setPending(false);setConfirmOpen(false);
   setError(error instanceof Error?error.message:friendlyApiError({}));
  }
 }

 const consequences=[
  ["Applications",preview.counts.applications],
  ["Round records",preview.counts.rounds],
  ["Offer versions",preview.counts.offers],
 ] as const;
 return <form onSubmit={submit} className="min-w-0 space-y-4 border-b border-border pb-5">
  <h2 className="text-lg font-semibold text-foreground">Review consequences</h2>
  <p className="max-w-prose text-sm text-body">Closing stops new applications. Applicants without accepted offers who are still in the process are marked Not selected and told; pending withdrawal requests are settled. Accepted offers remain valid. Application, round and offer history is retained.</p>
  <dl className="grid min-w-0 grid-cols-3 gap-2 border-y border-border sm:gap-4">
   {consequences
    .map(([label,n])=><div key={label} className="min-w-0 py-3">
     <dt className="text-xs text-body">{label}</dt><dd className="break-words text-xl font-semibold tabular-nums sm:text-2xl">{n}</dd>
    </div>)}
  </dl>
  <label className="grid min-w-0 gap-2 text-sm font-semibold text-body">Reason for closure (audited)
   <Textarea required name="reason" minLength={10} maxLength={1000} rows={3}
    disabled={pending} value={reasonText} onChange={event=>{setReasonText(event.target.value);setError(null);}}
    className="min-h-24 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-foreground"/>
   <span className="text-xs font-normal text-muted-foreground">{reasonText.length}/1000 characters</span></label>
  <p className="text-xs text-body">If the drive version or these counts change, closing is rejected and you must review the consequences again.</p>
  {error?<InlineNotice tone="error" message={error}/>:null}
  <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto md:min-h-9">
   {pending?"Closing…":"Review and close drive"}</Button>
  <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!next&&!pending)setConfirmOpen(false);}} pending={pending}
    title="Close this drive?"
    description="New applications stop, open applicants are marked Not selected and told, and pending withdrawal requests are settled. Accepted offers remain valid. This action is audited."
    confirmLabel="Review and close drive" confirmVariant="danger" onConfirm={()=>void performClose()}>
    <p className="text-sm text-body">Applications: {preview.counts.applications} · Round records: {preview.counts.rounds} · Offer versions: {preview.counts.offers}</p>
  </ConfirmDialog>
 </form>;
}
