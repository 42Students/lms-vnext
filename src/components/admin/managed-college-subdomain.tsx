"use client";
import {useState} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Alert} from "@/components/ui/alert";
import {useRouter} from "next/navigation";
type Managed={ready:boolean;baseDomain:string|null;currentHost:string|null};
export function ManagedCollegeSubdomain({collegeId,initial}:{collegeId:string;initial:Managed}){
 const router=useRouter(),[state,setState]=useState(initial),[label,setLabel]=useState(
  initial.currentHost&&initial.baseDomain?initial.currentHost.slice(0,-initial.baseDomain.length-1):"");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [messageTone,setMessageTone]=useState<"success"|"error">("success");
 const [pendingAction,setPendingAction]=useState<"ALLOT"|"CHANGE"|"REMOVE"|null>(null);
 async function send(action:"ALLOT"|"CHANGE"|"REMOVE"){
  if(!state.ready||busy)return;
  const host=label.trim().toLowerCase();
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
    throw Error(messages[problem.error??""]??problem.error??"Request failed");
   }
   const data=await res.json() as {host:string|null};
   setState({...state,currentHost:data.host});setPendingAction(null);
   setMessageTone("success");
   setMessage(data.host?data.host+" is live":"Managed web address removed.");
   router.refresh();
  }catch(err){setMessageTone("error");setMessage(err instanceof Error?err.message:"Unable to update address");}
  finally{setBusy(false);}
 }
 return <section className="space-y-3 border-t border-border pt-5" aria-label="Managed college web address">
  <h2 className="font-semibold">Web address · Managed subdomain</h2>
  {!state.ready?<Alert tone="warning">
   One-click allotment requires an operator-confirmed wildcard DNS and HTTPS configuration; it is not enabled on this deployment.</Alert>:
   <>
    <p className="text-sm">Platform domain: {state.baseDomain}</p>
    <p className="text-sm">Current: {state.currentHost??"Not allotted"}</p>
    <label className="grid max-w-md gap-1 text-sm print:hidden">Subdomain
      <div className="flex items-center gap-2">
       <Input value={label} maxLength={63} autoCapitalize="none" spellCheck={false}
        onChange={e=>setLabel(e.target.value)} className="min-h-11 min-w-0 flex-1 md:min-h-9"/>
       <span>.{state.baseDomain}</span>
      </div>
    </label>
    <div className="flex flex-wrap gap-2 print:hidden">
     <Button type="button" disabled={busy||!label.trim()} onClick={()=>setPendingAction(state.currentHost?"CHANGE":"ALLOT")}
      className="min-h-11 md:min-h-9">
      {state.currentHost?"Change":"Allot"}</Button>
     {state.currentHost&&<Button type="button" variant="secondary" disabled={busy} onClick={()=>setPendingAction("REMOVE")}
      className="min-h-11 md:min-h-9">Remove</Button>}
    </div>
    <p className="text-xs text-muted-foreground">A managed address is routed only when the configured wildcard DNS and TLS infrastructure is operational.</p>
   </>}
  <ConfirmDialog open={pendingAction!==null} onOpenChange={open=>{if(!open)setPendingAction(null);}}
   title={pendingAction==="REMOVE"?"Remove this managed web address?":pendingAction==="CHANGE"?"Change this college's live web address?":"Allot this platform subdomain?"}
   description="Confirm the managed web address change for this college." confirmLabel={pendingAction==="REMOVE"?"Remove":pendingAction==="CHANGE"?"Change":"Allot"}
   pending={busy} onConfirm={()=>{if(pendingAction)void send(pendingAction);}}>
   {message?<Alert tone={messageTone}>{message}</Alert>:null}
  </ConfirmDialog>
  {message&&<Alert tone={messageTone}>{message}</Alert>}
 </section>;
}
