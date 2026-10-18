"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";
type Preview={id:string;expectedUpdatedAt:string;counts:{applications:number;rounds:number;offers:number}};
export function TpoDriveClosePreviewForm({preview}:{preview:Preview}){
 const router=useRouter(),[pending,setPending]=useState(false),[error,setError]=useState<string|null>(null);
 const {run}=useGuardedAction({timeoutMs:35000});
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [confirmedReason,setConfirmedReason]=useState("");
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending)return;
  const reason=String(new FormData(event.currentTarget).get("reason")??"").trim();
  if(reason.length<10){setError("Reason for closure must be at least 10 characters.");return;}
  setConfirmedReason(reason);setConfirmOpen(true);
 }
 async function performClose(){
  if(pending||!confirmedReason)return;
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
 }

 const consequences=[
  ["Applications",preview.counts.applications],
  ["Round records",preview.counts.rounds],
  ["Offer versions",preview.counts.offers],
 ] as const;
 return <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <h2 className="text-lg font-semibold text-foreground">Review consequences</h2>
  <p className="text-sm text-body">Closing stops new applications. Applicants without accepted offers who are still in the process are marked Not selected and told; pending withdrawal requests are settled. Accepted offers remain valid. Application, round and offer history is retained.</p>
  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
   {consequences
    .map(([label,n])=><div key={label} className="rounded-lg border border-border bg-surface-subtle p-3">
     <dt className="text-xs text-body">{label}</dt><dd className="text-2xl font-semibold tabular-nums">{n}</dd>
    </div>)}
  </dl>
  <label className="block text-sm font-semibold text-body">Reason for closure (audited)
   <textarea required name="reason" minLength={10} maxLength={1000} rows={3}
    className="mt-2 w-full rounded-md border border-border bg-surface p-3 text-foreground"/></label>
  <p className="text-xs text-body">If the drive version or these counts change, closing is rejected and you must review the consequences again.</p>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <button type="submit" disabled={pending} className="min-h-11 rounded-md bg-primary px-5 font-semibold text-foreground disabled:opacity-50">
   {pending?"Closing…":"Review and close drive"}</button>
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} pending={pending}
    title="Close this drive?"
    description="New applications stop, open applicants are marked Not selected and told, and pending withdrawal requests are settled. Accepted offers remain valid. This action is audited."
    confirmLabel="Review and close drive" onConfirm={()=>void performClose()}/>
 </form>;
}
