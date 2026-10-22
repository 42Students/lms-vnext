"use client";
import { Textarea } from "@/components/ui/textarea";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {TPO_DRIVE_REQUEST_DECISION_COPY} from "@/modules/placements/tpo-drive-request-decision-model";
import {Button} from "@/components/ui/button";
import {Dropdown} from "@/components/ui/dropdown";
type Action="APPROVE_LATER"|"SEND_BACK"|"DECLINE";
export function TpoDriveRequestActions({requestId,status}:{
  requestId:string;status:"REQUEST"|"SENT_BACK";
}){
  const router=useRouter();
  const [action,setAction]=useState<Action|null>(null);
  const [reason,setReason]=useState("");
  const [busy,setBusy]=useState(false);
  const {run:runGuarded,pending:guardedPending}=useGuardedAction();
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const actions=[
    {value:"APPROVE_LATER" as const,label:TPO_DRIVE_REQUEST_DECISION_COPY.approve},
    {value:"SEND_BACK" as const,label:TPO_DRIVE_REQUEST_DECISION_COPY.sendBack},
    {value:"DECLINE" as const,label:TPO_DRIVE_REQUEST_DECISION_COPY.decline},
  ];
  async function submit(){
    if(!action || busy || guardedPending || reason.trim().length<3)return;
    setBusy(true);setError("");setMessage("");
    try{
      await apiFetch<{approvedJobId?:string}>("/api/placements/tpo/drive-requests/"+
        encodeURIComponent(requestId)+"/decision",{
        method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action,expectedStatus:status,reason:reason.trim(),confirmed:true}),
      });
      setMessage(action==="APPROVE_LATER"?
        "Approved for later. Open the draft to review before publishing.":
        action==="DECLINE"?"Request declined. It is now cancelled.":"Changes requested.");
      setAction(null);router.refresh();
    }catch(cause){
      setError(cause instanceof FriendlyFetchError && cause.code==="REQUEST_STALE"
        ?"This request changed. Refresh the list before deciding."
        :cause instanceof FriendlyFetchError && cause.code==="WORK_MODE_REVIEW_REQUIRED"
        ?"The recruiter did not specify a work mode. Request a change before approval."
        :cause instanceof Error?cause.message:"Could not save this decision. Please try again.");
    }finally{setBusy(false);}
  }
  return <div className="space-y-2">
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Button variant="primary" type="button" disabled={busy||guardedPending}
        onClick={()=>{
          setAction("APPROVE_LATER");setError("");setMessage("");
          setReason("Approved for later");
        }}>
        {TPO_DRIVE_REQUEST_DECISION_COPY.approve}
      </Button>
      <Dropdown mobileSheet align="end" label="Other request decisions" trigger="More ···">
        <div className="flex min-w-48 flex-col gap-1">
          {actions.slice(1).map(option=><Button variant="ghost" key={option.value} type="button" disabled={busy||guardedPending}
            className="w-full justify-start text-left"
            onClick={event=>{
              const menu=event.currentTarget.closest("details");
              if (menu) { menu.open=false; menu.querySelector("summary")?.focus(); }
              setAction(option.value);setError("");setMessage("");setReason("");
            }}>
            {option.label}
          </Button>)}
        </div>
      </Dropdown>
    </div>
    {action?<form onSubmit={event=>{event.preventDefault();void runGuarded(submit);}}
      aria-label={actions.find(x=>x.value===action)?.label}
      className="space-y-2 border-t border-border pt-4">
      <p className="text-sm font-semibold">{actions.find(x=>x.value===action)?.label}</p>
      <p className="text-sm text-body">{action==="APPROVE_LATER"?
        "This creates a draft. No students are told until you publish.":
        action==="SEND_BACK"?"Tell the recruiter what needs to change.":
        "Tell the recruiter why this request is not accepted."}</p>
      <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reason
        <Textarea autoFocus value={reason} maxLength={1000} rows={3} disabled={busy||guardedPending}
          onChange={event=>setReason(event.target.value)}
          className="mt-1 block w-full border p-2"/>
      </label>
      <p className="text-xs text-body">The recruiter is notified in the app. Email delivery is not enabled.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy||guardedPending||reason.trim().length<3}
          >
          {busy?"Saving…":"Confirm"}</Button>
        <Button variant="secondary" type="button" disabled={busy} onClick={()=>setAction(null)}
          >Cancel</Button>
      </div>
    </form>:null}
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    {message?<p role="status" className="text-sm">{message}</p>:null}
  </div>;
}
