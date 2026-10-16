"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {TPO_DRIVE_REQUEST_DECISION_COPY} from "@/modules/placements/tpo-drive-request-decision-model";
type Action="APPROVE_LATER"|"SEND_BACK"|"DECLINE";
export function TpoDriveRequestActions({requestId,status}:{
  requestId:string;status:"REQUEST"|"SENT_BACK";
}){
  const router=useRouter();
  const [action,setAction]=useState<Action|null>(null);
  const [reason,setReason]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const actions=[
    {value:"APPROVE_LATER" as const,label:TPO_DRIVE_REQUEST_DECISION_COPY.approve},
    {value:"SEND_BACK" as const,label:TPO_DRIVE_REQUEST_DECISION_COPY.sendBack},
    {value:"DECLINE" as const,label:TPO_DRIVE_REQUEST_DECISION_COPY.decline},
  ];
  async function submit(){
    if(!action || busy || reason.trim().length<3)return;
    setBusy(true);setError("");setMessage("");
    try{
      const response=await fetch("/api/placements/tpo/drive-requests/"+
        encodeURIComponent(requestId)+"/decision",{
        method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action,expectedStatus:status,reason:reason.trim(),confirmed:true}),
      });
      const data=await response.json() as {error?:string;approvedJobId?:string};
      if(!response.ok)throw new Error(data.error==="REQUEST_STALE"?
        "This request changed. Refresh the list before deciding.":data.error??"Decision could not be saved");
      setMessage(action==="APPROVE_LATER"?
        "Approved for later. Open the draft to review before publishing.":
        action==="DECLINE"?"Request declined. It is now cancelled.":"Changes requested.");
      setAction(null);router.refresh();
    }catch(cause){
      setError(cause instanceof Error?cause.message:"Could not save this decision");
    }finally{setBusy(false);}
  }
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      {actions.map(option=><button key={option.value} type="button" disabled={busy}
        onClick={()=>{
          setAction(option.value);setError("");setMessage("");
          setReason(option.value==="APPROVE_LATER"?"Approved for later":"");
        }}
        className="min-h-10 rounded border border-border px-3 text-sm font-semibold">
        {option.label}</button>)}
    </div>
    {action?<div role="group" aria-label={actions.find(x=>x.value===action)?.label}
      className="space-y-2 rounded border border-border p-3">
      <p className="text-sm font-semibold">{actions.find(x=>x.value===action)?.label}</p>
      <p className="text-sm text-body">{action==="APPROVE_LATER"?
        "This creates a draft. No students are told until you publish.":
        action==="SEND_BACK"?"Tell the recruiter what needs to change.":
        "Tell the recruiter why this request is not accepted."}</p>
      <label className="block text-sm">Reason
        <textarea value={reason} maxLength={1000} rows={3} disabled={busy}
          onChange={event=>setReason(event.target.value)}
          className="mt-1 block w-full rounded border border-border bg-surface p-2"/>
      </label>
      <p className="text-xs text-body">The recruiter is notified in the app. Email delivery is not enabled.</p>
      <div className="flex gap-2">
        <button type="button" onClick={()=>void submit()} disabled={busy||reason.trim().length<3}
          className="min-h-10 rounded bg-primary px-3 text-sm text-on-primary disabled:opacity-50">
          {busy?"Saving…":"Confirm"}</button>
        <button type="button" disabled={busy} onClick={()=>setAction(null)}
          className="min-h-10 rounded border border-border px-3 text-sm">Cancel</button>
      </div>
    </div>:null}
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    {message?<p role="status" className="text-sm">{message}</p>:null}
  </div>;
}
