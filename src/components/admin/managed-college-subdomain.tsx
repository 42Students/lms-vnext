"use client";
import {useEffect,useId,useState} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Alert} from "@/components/ui/alert";
import {useRouter} from "next/navigation";
type Managed={ready:boolean;baseDomain:string|null;currentHost:string|null};
export function ManagedCollegeSubdomain({collegeId,initial}:{collegeId:string;initial:Managed}){
 const router=useRouter(),hintId=useId(),[state,setState]=useState(initial),[label,setLabel]=useState(
  initial.currentHost&&initial.baseDomain?initial.currentHost.slice(0,-initial.baseDomain.length-1):"");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [messageTone,setMessageTone]=useState<"success"|"error">("success");
 const [pendingAction,setPendingAction]=useState<"ALLOT"|"CHANGE"|"REMOVE"|null>(null);
 const normalizedLabel=label.trim().toLowerCase();
 // Match the managed (not custom DNS) address contract in the old LMS.
 // Domain-service still enforces its own tenant ownership and reserved names.
 const managedLabelPattern=/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
 const labelInvalid=normalizedLabel.length>0&&!managedLabelPattern.test(normalizedLabel);
 useEffect(()=>{
  setState(initial);
  setLabel(initial.currentHost&&initial.baseDomain?initial.currentHost.slice(0,-initial.baseDomain.length-1):"");
  setPendingAction(null);setMessage("");
 },[collegeId,initial.currentHost,initial.baseDomain,initial.ready]);
 async function send(action:"ALLOT"|"CHANGE"|"REMOVE"){
  if(!state.ready||busy)return;
  const host=label.trim().toLowerCase();
  if(action!=="REMOVE"&&!managedLabelPattern.test(host)){
   setMessageTone("error");
   setMessage("Use 3 to 30 lowercase letters, numbers or hyphens, starting and ending with a letter or number.");
   return;
  }
  setBusy(true);setMessage("");
  try{
   const res=await fetch("/api/admin/colleges/"+encodeURIComponent(collegeId)+"/subdomain",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({action,...(action==="REMOVE"?{}:{label:host}),expectedHost:state.currentHost}),
   });
   if(!res.ok){
    const problem=await res.json().catch(()=>({error:"Request failed"})) as {error?:string};
    const messages:Record<string,string>={
     MANAGED_WILDCARD_NOT_READY:"Managed web addresses are not available on this deployment.",
     SUBDOMAIN_STALE:"The college web address changed. Refresh and try again.",
     SUBDOMAIN_CONFLICT:"This web address is already assigned.",
     HOST_CONFLICT:"This web address is already taken by another college.",
    };
    throw Error(messages[problem.error??""]??
      (action==="REMOVE"?"Couldn't remove the address. Try again.":"Couldn't allot this address. Try again."));
   }
   const data=await res.json() as {host:string|null};
   setState(current=>({...current,currentHost:data.host}));setPendingAction(null);
   if(action==="REMOVE")setLabel("");
   setMessageTone("success");
   setMessage(data.host?data.host+" is live":"Web address removed");
   router.refresh();
  }catch(err){setMessageTone("error");setMessage(err instanceof Error?err.message:
     action==="REMOVE"?"Couldn't remove the address. Try again.":"Couldn't allot this address. Try again.");}
  finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-3 border-t border-border pt-4" aria-busy={busy} aria-label="Managed college web address">
  <h2 className="m-0 text-lg font-semibold leading-7 text-[var(--lms-heading)]">Web address · Managed subdomain</h2>
  {!state.ready?<Alert tone="warning">
   One-click allotment requires an operator-confirmed wildcard DNS and HTTPS configuration; it is not enabled on this deployment.</Alert>:
   <>
    <dl className="grid min-w-0 gap-2 border-y border-border py-3 text-sm sm:grid-cols-2">
     <div className="min-w-0"><dt className="text-xs font-semibold text-muted-foreground">Platform domain</dt><dd className="mt-1 break-all text-body">{state.baseDomain}</dd></div>
     <div className="min-w-0"><dt className="text-xs font-semibold text-muted-foreground">Current</dt><dd className="mt-1 break-all text-body">{state.currentHost??"Not allotted"}</dd></div>
    </dl>
    <label className="grid min-w-0 max-w-xl gap-1.5 text-[13px] text-[var(--lms-neutral-400)] font-semibold leading-4">Subdomain
      <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] md:flex-row md:items-center">
       <Input value={label} maxLength={30} autoCapitalize="none" spellCheck={false} disabled={busy}
        aria-invalid={labelInvalid} aria-describedby={hintId}
        onChange={e=>{setLabel(e.target.value);if(message)setMessage("");}}
        className="min-h-11 w-full min-w-0 flex-1 md:min-h-9"/>
       <span className="min-w-0 break-all text-sm text-body">.{state.baseDomain}</span>
      </div>
      <span id={hintId} className={labelInvalid?"break-words text-xs font-normal leading-5 text-[var(--lms-error)]":"break-words text-xs font-normal leading-5 text-muted-foreground"}>{labelInvalid?"Use 3 to 30 lowercase letters, numbers or hyphens, starting and ending with a letter or number.":"Use 3 to 30 lowercase letters, numbers or hyphens, starting and ending with a letter or number."}</span>
    </label>
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
     <Button type="button" disabled={busy||!normalizedLabel||labelInvalid} onClick={()=>{setMessage("");setPendingAction(state.currentHost?"CHANGE":"ALLOT");}}
      className="min-h-11 w-full sm:min-h-9 sm:w-auto">
      {state.currentHost?"Change":"Allot"}</Button>
     {state.currentHost&&<Button type="button" variant="secondary" disabled={busy} onClick={()=>{setMessage("");setPendingAction("REMOVE");}}
      className="min-h-11 w-full sm:min-h-9 sm:w-auto">Remove</Button>}
    </div>
    <p className="text-xs text-muted-foreground">A managed address is routed only when the configured wildcard DNS and TLS infrastructure is operational.</p>
   </>}
  <ConfirmDialog open={pendingAction!==null} onOpenChange={open=>{if(!open&&!busy)setPendingAction(null);}}
   title={pendingAction==="REMOVE"?"Remove this managed web address?":pendingAction==="CHANGE"?"Change this college's live web address?":"Allot this platform subdomain?"}
   description={pendingAction==="CHANGE"
     ?"Moving this college's web address to "+normalizedLabel+"."+state.baseDomain+
       " will stop the current address "+state.currentHost+
       " from working immediately. Share the new address with everyone who signs in."
     :pendingAction==="REMOVE"
     ?"Removing "+state.currentHost+
       " makes this college unreachable at that web address. College data and accounts are not deleted."
     :"Confirm allotment of "+normalizedLabel+"."+state.baseDomain+
       " to this college. Only the selected college's address will change."}
   confirmLabel={pendingAction==="REMOVE"?"Remove":pendingAction==="CHANGE"?"Change":"Allot"} confirmVariant={pendingAction==="REMOVE"?"danger":"primary"}
   pending={busy} confirmDisabled={!state.ready||(pendingAction!=="REMOVE"&&(!normalizedLabel||labelInvalid))}
   onConfirm={()=>{if(pendingAction)void send(pendingAction);}}>
   <div className="min-w-0 space-y-3">
    <p className="m-0 break-words text-sm leading-5 text-body">Current: {state.currentHost??"Not allotted"}</p>
    {pendingAction!=="REMOVE"?<p className="m-0 break-all text-sm font-semibold leading-5 text-foreground">New: {normalizedLabel}.{state.baseDomain}</p>:null}
    {message&&messageTone==="error"?<Alert tone="error">{message}</Alert>:null}
   </div>
  </ConfirmDialog>
  {message&&pendingAction===null?<Alert tone={messageTone}>{message}</Alert>:null}
 </section>;
}
