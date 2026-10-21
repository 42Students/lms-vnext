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
 const [pendingAction,setPendingAction]=useState<"CHANGE"|"REMOVE"|null>(null);
 const [pendingReload,setPendingReload]=useState(false);
 const [loading,setLoading]=useState(false);
 const [loadError,setLoadError]=useState("");
 const [leaveHref,setLeaveHref]=useState<string|null>(null);
 const currentLabel=state.currentHost&&state.baseDomain?
  state.currentHost.slice(0,-state.baseDomain.length-1):"";
 const dirty=Boolean(label&&label!==currentLabel);
 const normalizedLabel=label.trim().toLowerCase();
 const proposedHost=state.baseDomain?normalizedLabel+"."+state.baseDomain:"";
 // Match the managed (not custom DNS) address contract in the old LMS.
 // Domain-service still enforces its own tenant ownership and reserved names.
 const managedLabelPattern=/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
 const labelInvalid=normalizedLabel.length>0&&!managedLabelPattern.test(normalizedLabel);
 useEffect(()=>{
  setState(initial);
  setLabel(initial.currentHost&&initial.baseDomain?initial.currentHost.slice(0,-initial.baseDomain.length-1):"");
  setPendingAction(null);setMessage("");setLoadError("");
 },[collegeId,initial.currentHost,initial.baseDomain,initial.ready]);
 useEffect(()=>{
  if(!dirty)return;
  const before=(event:BeforeUnloadEvent)=>{
   event.preventDefault();event.returnValue="";
  };
  const onLink=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||
      event.ctrlKey||event.shiftKey||event.altKey||!(event.target instanceof Element))return;
   const anchor=event.target.closest("a[href]");
   if(!(anchor instanceof HTMLAnchorElement)||anchor.hasAttribute("download")||
     anchor.target&&anchor.target!=="_self")return;
   const url=new URL(anchor.href,window.location.href);
   if(url.origin!==window.location.origin||url.pathname===window.location.pathname&&
     url.search===window.location.search)return;
   event.preventDefault();event.stopPropagation();setLeaveHref(url.href);
  };
  window.addEventListener("beforeunload",before);
  document.addEventListener("click",onLink,true);
  return ()=>{window.removeEventListener("beforeunload",before);document.removeEventListener("click",onLink,true);};
 },[dirty]);
 async function reload(force=false){
  if(busy||loading||!collegeId)return;
  if(dirty&&!force){setPendingReload(true);return;}
  setLoading(true);setLoadError("");setMessage("");
  try{
   const response=await fetch("/api/admin/colleges/"+encodeURIComponent(collegeId)+"/subdomain",{
    method:"GET",cache:"no-store",credentials:"same-origin",
   });
   if(!response.ok)throw Error("Couldn't load this college web address.");
   const next=await response.json() as Managed;
   setState(next);
   setLabel(next.currentHost&&next.baseDomain?next.currentHost.slice(0,-next.baseDomain.length-1):"");
   setMessage("");setPendingAction(null);
  }catch(error){setLoadError(error instanceof Error?error.message:"Couldn't load this college web address.");}
  finally{setLoading(false);setPendingReload(false);}
 }
 async function send(action:"ALLOT"|"CHANGE"|"REMOVE"){
  if(!state.ready||busy||loading||Boolean(loadError))return;
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
 return <section className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4"
   aria-busy={busy||loading} aria-label="Managed college web address">
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
   <h2 className="m-0 text-lg font-semibold text-[var(--lms-heading)]">Web address</h2>
   <Button type="button" size="sm" variant="secondary" disabled={!collegeId||busy||loading}
    onClick={()=>void reload()}>
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
     stroke="currentColor" strokeWidth={2} strokeLinecap="round"
     strokeLinejoin="round" aria-hidden="true">
     <path d="M20 7v5h-5M4 17v-5h5"/><path d="M5 9a7 7 0 0 1 12-2l3 5M4 12l3 5a7 7 0 0 0 12-2"/>
    </svg> {loading?"Loading…":"Reload"}
   </Button>
  </div>
  {loadError?<Alert tone="error" title="Web address could not be loaded">
    {loadError}
    <Button type="button" size="sm" variant="secondary" className="mt-2"
     onClick={()=>void reload(true)}>Retry</Button>
   </Alert>:null}
  <p className="max-w-[70ch] text-[13px] leading-5 text-body">
    Give this college its own web address. It works straight away, with HTTPS,
    once wildcard DNS and TLS have been configured and verified for the deployment.
  </p>
  {!state.ready?<Alert tone="warning">
    One-click allotment requires an operator-confirmed wildcard DNS and HTTPS configuration; it is not enabled on this deployment.
   </Alert>:<>
   {state.currentHost?<div role="status" className="flex flex-wrap items-center gap-2 rounded-md border border-[#b7eb8f] bg-[#f6ffed] p-3 text-sm text-[#237804]">
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx={12} cy={12} r={9}/><path d="m8 12 3 3 5-6"/>
    </svg>
    <strong>Live at</strong>
    <a href={"https://"+state.currentHost} target="_blank" rel="noopener noreferrer"
      className="inline-flex min-h-9 items-center gap-1 break-all font-semibold underline"
      aria-label={"Open "+state.currentHost+" in a new tab"}>
      {state.currentHost}
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={2} aria-hidden="true">
       <path d="M12 4h8v8m0-8-9 9"/><path d="M20 14v6H4V4h6"/>
      </svg>
    </a>
   </div>:null}
   <label className="grid min-w-0 max-w-[560px] gap-1 text-[13px] font-semibold text-body">
    Subdomain
    <div className="flex min-w-0 flex-wrap items-center gap-2">
     <div className="flex min-h-11 min-w-0 flex-[1_1_220px] overflow-hidden rounded-[var(--lms-control-radius)] border border-border md:min-h-9">
      <Input type="text" value={label} maxLength={30} placeholder="kluniversity"
       aria-label="Subdomain" autoCapitalize="none" spellCheck={false}
       disabled={busy||loading||Boolean(loadError)} aria-describedby={hintId}
       aria-invalid={labelInvalid} onChange={e=>{
        setLabel(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,30));
        if(message)setMessage("");
       }}
       className="h-full min-w-0 flex-1 !rounded-none !border-0"/>
      <span className="inline-flex shrink-0 items-center border-l border-border bg-[var(--lms-neutral-50)] px-2 text-xs text-muted-foreground">
       .{state.baseDomain}
      </span>
     </div>
     <Button type="button" disabled={busy||loading||Boolean(loadError)||
        !normalizedLabel||labelInvalid||normalizedLabel===currentLabel}
      onClick={()=>{setMessage("");
       if(state.currentHost)setPendingAction("CHANGE");
       else void send("ALLOT");
      }} className="min-h-11 md:min-h-9">
      {state.currentHost?"Change":"Allot"}</Button>
     {state.currentHost?<Button type="button" variant="danger" disabled={busy||loading||Boolean(loadError)}
       className="min-h-11 md:min-h-9"
       onClick={()=>{setMessage("");setPendingAction("REMOVE");}}>Remove</Button>:null}
    </div>
    <span id={hintId} className={labelInvalid?
       "text-xs font-normal text-error":"text-xs font-normal text-muted-foreground"}>
     Use 3 to 30 lowercase letters, numbers or hyphens, starting and ending with a letter or number.
    </span>
   </label>
   {dirty?<p role="status" className="text-xs text-warning-text">
     Unsaved web-address edits. Leaving the page or switching colleges discards the typed label.
   </p>:null}
  </>}
  <ConfirmDialog open={pendingAction!==null}
   onOpenChange={open=>{if(!open&&!busy)setPendingAction(null);}}
   title={pendingAction==="REMOVE"?"Remove "+state.currentHost+"?":
     "Move this college to "+proposedHost+"?"}
   description={pendingAction==="REMOVE"?
    "Removing this host makes the college unreachable at the old web address. College data and accounts are not deleted.":
    "The current address stops working immediately. Share the new address with everyone who signs in."}
   confirmLabel={pendingAction==="REMOVE"?"Remove":"Move"}
   cancelLabel={pendingAction==="REMOVE"?"Keep address":"Keep current"}
   confirmVariant={pendingAction==="REMOVE"?"danger":"primary"}
   pending={busy}
   confirmDisabled={!state.ready||Boolean(loadError)||
     (pendingAction!=="REMOVE"&&(!normalizedLabel||labelInvalid||normalizedLabel===currentLabel))}
   onConfirm={()=>{if(pendingAction)void send(pendingAction);}}>
   <p className="break-words text-sm text-body">
    Current: {state.currentHost??"Not allotted"}
   </p>
  </ConfirmDialog>
  <ConfirmDialog open={pendingReload}
   onOpenChange={setPendingReload} title="Discard unsaved subdomain change?"
   description="Reloading discards your typed web address and fetches the current saved host."
   confirmLabel="Discard changes and reload" confirmVariant="danger"
   onConfirm={()=>void reload(true)}/>
  <ConfirmDialog open={leaveHref!==null}
   onOpenChange={open=>{if(!open)setLeaveHref(null);}}
   title="Leave without saving the web address?"
   description="The typed subdomain differs from this college's current address."
   confirmLabel="Leave without saving" confirmVariant="danger"
   onConfirm={()=>{if(leaveHref)window.location.assign(leaveHref);}}/>
  {message&&pendingAction===null?<Alert tone={messageTone}>{message}</Alert>:null}
 </section>;
}
