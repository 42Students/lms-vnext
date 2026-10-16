"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
type Managed={ready:boolean;baseDomain:string|null;currentHost:string|null};
export function ManagedCollegeSubdomain({collegeId,initial}:{collegeId:string;initial:Managed}){
 const router=useRouter(),[state,setState]=useState(initial),[label,setLabel]=useState(
  initial.currentHost&&initial.baseDomain?initial.currentHost.slice(0,-initial.baseDomain.length-1):"");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function send(action:"ALLOT"|"CHANGE"|"REMOVE"){
  if(!state.ready||busy)return;
  const host=label.trim().toLowerCase();
  if(!window.confirm(action==="REMOVE"?"Remove this managed web address?":
   action==="CHANGE"?"Change this college's live web address?":"Allot this platform subdomain?"))return;
  setBusy(true);setMessage("");
  try{
   const res=await fetch("/api/admin/colleges/"+encodeURIComponent(collegeId)+"/subdomain",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({action,...(action==="REMOVE"?{}:{label:host}),expectedHost:state.currentHost}),
   });
   if(!res.ok){const problem=await res.json().catch(()=>({error:"Request failed"}));throw Error(problem.error??"Request failed");}
   const data=await res.json() as {host:string|null};
   setState({...state,currentHost:data.host});
   setMessage(data.host?data.host+" is allotted on the managed platform domain.":"Managed web address removed.");
   router.refresh();
  }catch(err){setMessage(err instanceof Error?err.message:"Unable to update address");}
  finally{setBusy(false);}
 }
 return <section className="space-y-3 rounded-xl border border-border bg-surface p-5" aria-label="Managed college web address">
  <h2 className="font-semibold">Web address · Managed subdomain</h2>
  {!state.ready?<p role="status" className="text-sm text-warning-text">
   One-click allotment requires an operator-confirmed wildcard DNS and HTTPS configuration; it is not enabled on this deployment.</p>:
   <>
    <p className="text-sm">Platform domain: {state.baseDomain}</p>
    <p className="text-sm">Current: {state.currentHost??"Not allotted"}</p>
    <label className="grid max-w-md gap-1 text-sm">Subdomain
      <div className="flex items-center gap-2">
       <input value={label} maxLength={63} autoCapitalize="none" spellCheck={false}
        onChange={e=>setLabel(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded border border-border p-2"/>
       <span>.{state.baseDomain}</span>
      </div>
    </label>
    <div className="flex flex-wrap gap-2">
     <button type="button" disabled={busy||!label.trim()} onClick={()=>void send(state.currentHost?"CHANGE":"ALLOT")}
      className="min-h-11 rounded bg-primary px-4 text-sm text-on-primary disabled:opacity-50">
      {state.currentHost?"Change":"Allot"}</button>
     {state.currentHost&&<button type="button" disabled={busy} onClick={()=>void send("REMOVE")}
      className="min-h-11 rounded border border-border px-4 text-sm">Remove</button>}
    </div>
    <p className="text-xs text-muted-foreground">A managed address is routed only when the configured wildcard DNS and TLS infrastructure is operational.</p>
   </>}
  {message&&<p role="status" className="text-sm">{message}</p>}
 </section>;
}
