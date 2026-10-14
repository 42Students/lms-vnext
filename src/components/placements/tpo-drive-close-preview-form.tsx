"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
type Preview={id:string;expectedUpdatedAt:string;counts:{applications:number;rounds:number;offers:number}};
export function TpoDriveClosePreviewForm({preview}:{preview:Preview}){
 const router=useRouter(),[pending,setPending]=useState(false),[error,setError]=useState<string|null>(null);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending)return;
  const reason=String(new FormData(event.currentTarget).get("reason")??"");
  if(!window.confirm("Close this published drive? New applications stop while current applicants, rounds and offers remain recorded. The action will be audited."))return;
  setPending(true);setError(null);
  try{
   const response=await fetch("/api/placements/tpo/jobs/"+preview.id+"/close-preview",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({action:"CLOSE",confirmed:true,expectedUpdatedAt:preview.expectedUpdatedAt,
     expectedCounts:preview.counts,reason}),
   });
   if(!response.ok){const body=await response.json().catch(()=>null) as {error?:string}|null;
    throw Error(body?.error??"Preview became stale. Refresh and review again.");}
   router.push("/tpo/placements/jobs/"+preview.id);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Close failed");}finally{setPending(false);}
 }
 const consequences=[
  ["Applications",preview.counts.applications],
  ["Round records",preview.counts.rounds],
  ["Offer versions",preview.counts.offers],
 ] as const;
 return <form onSubmit={e=>void submit(e)} className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <h2 className="text-lg font-semibold text-foreground">Review consequences</h2>
  <p className="text-sm text-body">Closing stops new applications. Existing applications, rounds and offers are retained, not deleted or silently cancelled.</p>
  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
   {consequences
    .map(([label,n])=><div key={label} className="rounded-lg border border-border bg-surface-subtle p-3">
     <dt className="text-xs text-body">{label}</dt><dd className="text-2xl font-semibold tabular-nums">{n}</dd>
    </div>)}
  </dl>
  <label className="block text-sm font-semibold text-body">Reason for closure (audited)
   <textarea required name="reason" minLength={10} maxLength={1000} rows={3}
    className="mt-2 w-full rounded-md border border-border bg-surface p-3 text-foreground"/></label>
  <p className="text-xs text-body">If the job version or counts change after this preview, the close is rejected.</p>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <button type="submit" disabled={pending} className="min-h-11 rounded-md bg-primary px-5 font-semibold text-on-primary disabled:opacity-50">
   {pending?"Closing…":"Review and close drive"}</button>
 </form>;
}
