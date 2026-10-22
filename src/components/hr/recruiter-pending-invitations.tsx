"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

type PendingInvitation={
 collegeId:string;
 collegeName:string;
 company:string;
 invitedContact:string|null;
 invitedAt:Date|string;
};
type Decision={collegeId:string;collegeName:string;action:"accept"|"decline"};

/** Pending college consent is visible even when the recruiter has no ACTIVE
 * college grant. The server independently verifies the signed-in actor,
 * pending relationship, active college and company before changing access.
 */
export function RecruiterPendingInvitations({invitations,total,hasMore}:{
 invitations:readonly PendingInvitation[];total:number;hasMore:boolean;
}){
 const router=useRouter();
 const [decision,setDecision]=useState<Decision|null>(null);
 const [busy,setBusy]=useState(false);
 const [completed,setCompleted]=useState<string[]>([]);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const visible=invitations.filter(item=>!completed.includes(item.collegeId));
 if(!visible.length)return null;
 async function respond(){
  if(!decision||busy)return;
  setBusy(true);setError("");setSuccess("");
  try{
   const response=await fetch(
    "/api/placements/recruiter/pending-invites/"+
      encodeURIComponent(decision.collegeId)+"/"+decision.action,
    {method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:"{}"},
   );
   if(!response.ok)throw new Error(response.status===409
    ?"This invitation has changed. Refresh the page and review it again.":
    response.status===401||response.status===403
    ?"This invitation is no longer available to your signed-in recruiter account.":
    "Could not respond to the invitation. Please retry.");
   setCompleted(previous=>[...previous,decision.collegeId]);
   setSuccess(decision.action==="accept"
    ?"Invitation accepted. Your college access is being refreshed.":
    "Invitation declined.");
   setDecision(null);
   router.refresh();
  }catch(cause){
   setError(cause instanceof Error?cause.message:"Could not respond to the invitation.");
  }finally{setBusy(false);}
 }
 return <section aria-labelledby="recruiter-pending-invitations" className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-5">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h2 id="recruiter-pending-invitations" className="text-base font-semibold text-[var(--lms-heading)]">
    Pending college invitations ({total})
   </h2>
   <span className="text-xs text-muted-foreground">Your approval is required</span>
  </div>
  <p className="text-sm leading-6 text-body">These invitations are tied to your signed-in recruiter identity. You can accept or decline without switching into a college you cannot yet access.</p>
  {success?<p role="status" className="text-sm text-success">{success}</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <ul className="divide-y divide-border border-y border-border">
   {visible.map(item=><li key={item.collegeId} className="flex min-w-0 flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
    <div className="min-w-0 space-y-1">
     <p className="break-words text-sm font-semibold text-foreground">{item.collegeName}</p>
     <p className="break-words text-xs text-body">{item.company}</p>
     {item.invitedContact?<p className="break-all text-xs text-muted-foreground">Invited work email: {item.invitedContact}</p>:null}
    </div>
    <div className="flex shrink-0 flex-wrap gap-2">
     <Button size="sm" variant="primary" disabled={busy}
      onClick={()=>{setError("");setDecision({collegeId:item.collegeId,collegeName:item.collegeName,action:"accept"});}}>Accept</Button>
     <Button size="sm" variant="secondary" disabled={busy}
      onClick={()=>{setError("");setDecision({collegeId:item.collegeId,collegeName:item.collegeName,action:"decline"});}}>Decline</Button>
    </div>
   </li>)}
  </ul>
  {hasMore?<p className="text-xs text-muted-foreground">Showing the first {invitations.length} invitations. Contact your placement cell about additional pending invitations.</p>:null}
  <ConfirmDialog open={decision!==null} onOpenChange={open=>{if(!open&&!busy)setDecision(null);}}
   title={decision?.action==="accept"?"Accept this college invitation?":"Decline this college invitation?"}
   confirmLabel={decision?.action==="accept"?"Accept invitation":"Decline invitation"}
   confirmVariant={decision?.action==="accept"?"primary":"danger"}
   pending={busy} onConfirm={()=>void respond()}>
   <p className="text-sm text-body">Your decision for {decision?.collegeName??"this college"} will be recorded. Access will only activate after the server verifies the invitation and recruiter relationship.</p>
   {error?<p role="alert" className="mt-2 text-sm text-error">{error}</p>:null}
  </ConfirmDialog>
 </section>;
}
