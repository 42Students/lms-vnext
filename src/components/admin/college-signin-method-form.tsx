"use client";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Alert} from "@/components/ui/alert";

import {useEffect,useRef,useState} from "react";
import {useToast} from "@/components/ui/toast";
import {useConfirmFlow} from "@/components/ui/use-confirm-flow";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useRouter} from "next/navigation";
import {collegeSignInMethodSchema,signInChannelOrder} from "@/modules/colleges/signin-methods-model";
import type {z} from "zod";
type Method=z.infer<typeof collegeSignInMethodSchema>;
const choices:{value:Method;label:string;hint:string}[]=[
 {value:"EMAIL_AND_PHONE",label:"Email and phone",hint:"Both, with email shown first."},
 {value:"PHONE_AND_EMAIL",label:"Phone and email",hint:"Both, with phone shown first."},
 {value:"EMAIL_ONLY",label:"Email only",hint:"Phone sign-in is turned off."},
 {value:"PHONE_ONLY",label:"Phone only",hint:"Email sign-in is turned off."},
];
export function CollegeSigninMethodForm({collegeId,method,version,ready,onDirtyChange,onBusyChange}:{collegeId:string;method:Method;version:number;ready:boolean;onDirtyChange?:(dirty:boolean)=>void;onBusyChange?:(busy:boolean)=>void}){
 const router=useRouter(),{showToast}=useToast(),{askConfirm,dialog}=useConfirmFlow();
 const requestSeq=useRef(0);
 const [selection,setSelection]=useState<Method>(method);
 const [savedMethod,setSavedMethod]=useState<Method>(method);
 const [currentVersion,setCurrentVersion]=useState(version);
 const {pending:saving,run:guardedRun}=useGuardedAction({busyLabel:"Saving..."});
 const [message,setMessage]=useState("");
 const [messageTone,setMessageTone]=useState<"success"|"error">("success");
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [fetching,setFetching]=useState(false);
 const [loadError,setLoadError]=useState("");
 const [reloadPending,setReloadPending]=useState(false);
 const dirty=selection!==savedMethod;
 useEffect(()=>{onDirtyChange?.(dirty);return ()=>onDirtyChange?.(false);},[dirty,onDirtyChange]);
 useEffect(()=>{onBusyChange?.(saving);return ()=>onBusyChange?.(false);},[saving,onBusyChange]);
 useEffect(()=>{return ()=>{requestSeq.current++;};},[collegeId]);
 useEffect(()=>{
   const beforeUnload=(event:BeforeUnloadEvent)=>{
     if(!dirty&&!saving)return;
     event.preventDefault();
     event.returnValue="";
   };
   window.addEventListener("beforeunload",beforeUnload);
   return ()=>window.removeEventListener("beforeunload",beforeUnload);
 },[dirty,saving]);
 useEffect(()=>{
   if(!dirty&&!saving)return;
   const intercept=(event:MouseEvent)=>{
     if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||
        !(event.target instanceof Element))return;
     const anchor=event.target.closest("a[href]");
     if(!(anchor instanceof HTMLAnchorElement)||anchor.hasAttribute("download")||
        (anchor.target&&anchor.target!=="_self"))return;
     const target=new URL(anchor.href,window.location.href);
     if(target.origin!==window.location.origin||
        (target.pathname===window.location.pathname&&target.search===window.location.search))return;
     event.preventDefault();event.stopPropagation();
     if(saving){showToast({tone:"info",title:"Wait until sign-in settings finish saving."});return;}
     void askConfirm("Discard unsaved sign-in settings? Keep editing to preserve your changes.").then(confirmed=>{
       if(confirmed)router.push(target.pathname+target.search+target.hash);
     });
   };
   document.addEventListener("click",intercept,true);
   return ()=>document.removeEventListener("click",intercept,true);
 },[dirty,saving,showToast,askConfirm,router]);
 async function reload(force=false){
  if(!collegeId||saving||fetching)return;
  if(dirty&&!force){setReloadPending(true);return;}
  const seq=++requestSeq.current;
  setFetching(true);setLoadError("");setMessage("");
  try{
   const response=await apiFetch<{policy:{kind:string;method:Method;version:number}}>(
    "/api/admin/colleges/"+encodeURIComponent(collegeId)+"/signin",{
     method:"GET",credentials:"same-origin",cache:"no-store",
    });
   if(requestSeq.current!==seq)return;
   if(response.policy?.kind==="INVALID_POLICY"||
     !collegeSignInMethodSchema.safeParse(response.policy?.method).success||
     !Number.isSafeInteger(response.policy?.version))
    throw Error("Sign-in settings could not be loaded");
   setSelection(response.policy.method);setSavedMethod(response.policy.method);
   setCurrentVersion(response.policy.version);setMessage("");
  }catch(error){
   if(requestSeq.current!==seq)return;
   const msg=error instanceof FriendlyFetchError?error.message:
    "Sign-in settings could not be loaded";
   setLoadError(msg);
  }finally{
   if(requestSeq.current===seq)setFetching(false);
   setReloadPending(false);
  }
 }
 async function save(){
  if(!ready||saving||fetching||Boolean(loadError)||selection===savedMethod)return;
  setMessage("");
  const seq=++requestSeq.current;
  await guardedRun(async()=>{
    try {
      const response=await apiFetch<{policy:{method:Method;version:number}}>(
       "/api/admin/colleges/"+encodeURIComponent(collegeId)+"/signin",{
        method:"PUT",headers:{"content-type":"application/json"},credentials:"same-origin",
        body:JSON.stringify({collegeId,method:selection,expectedVersion:currentVersion}),
      });
      // A successful but slow response must not leave the form with the old
      // optimistic version. Read and validate the persisted response first.
      const committed=response?.policy;
      if(!committed||!collegeSignInMethodSchema.safeParse(committed.method).success||
         !Number.isSafeInteger(committed.version)||committed.version<0)
       throw new Error("INVALID_POLICY_RESPONSE");
      if(requestSeq.current!==seq)return;
      setSavedMethod(committed.method);
      setCurrentVersion(committed.version);
      setConfirmOpen(false);setMessageTone("success");setMessage("Sign-in settings saved");
      showToast({tone:"success",title:"Sign-in settings saved"});router.refresh();
    }catch(error){
      if(requestSeq.current!==seq)return;
      const reason=error instanceof FriendlyFetchError&&error.status===409
        ?"Settings changed elsewhere. Refresh before retrying."
        :error instanceof FriendlyFetchError?error.message:"Please try again.";
      const feedback="Couldn\u0027t save sign-in settings: "+(reason==="INVALID_POLICY_RESPONSE"?"Please refresh and try again.":reason);
      setMessageTone("error");setMessage(feedback);
      showToast({tone:"error",title:feedback});
    }
  });
 }
 return <><section aria-label="College sign-in methods"
   className="min-w-0 max-w-[680px] space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
   <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Sign-in</h2>
   <Button type="button" size="sm" variant="secondary" disabled={!collegeId||fetching||saving}
    onClick={()=>void reload()}>
    <svg width={15} height={15} viewBox="0 0 24 24" strokeWidth={2}
     fill="none" stroke="currentColor" strokeLinecap="round"
     strokeLinejoin="round" aria-hidden="true">
     <path d="M20 7v5h-5M4 17v-5h5"/><path d="M5 9a7 7 0 0 1 12-2l3 5M4 12l3 5a7 7 0 0 0 12-2"/>
    </svg>
    {fetching?"Loading…":"Reload"}
   </Button>
  </div>
  <p className="max-w-[68ch] text-[13px] leading-5 text-body">
   How everyone — students, staff and recruiters — signs in on this college&apos;s own web address.
   Set this as per the college&apos;s plan. The main 42lms.com page always offers email first, then phone.
  </p>
  {loadError?<Alert tone="error" title="Sign-in settings could not be loaded">
    {loadError}
    <Button type="button" size="sm" variant="secondary"
     disabled={fetching} onClick={()=>void reload(true)} className="mt-2">Retry</Button>
   </Alert>:null}
  {!ready?<Alert tone="warning">Sign-in method storage is unavailable; changes are disabled. Reload after the storage migration is deployed.</Alert>:null}
  {fetching?<p role="status" className="text-sm text-body">Loading sign-in settings…</p>:null}
  <fieldset disabled={!ready||saving||fetching||Boolean(loadError)} className="min-w-0 print:hidden">
   <legend className="mb-2 text-sm font-semibold text-[var(--lms-heading)]">Sign-in methods</legend>
   <div role="radiogroup" aria-label="Sign-in methods" className="grid min-w-0 max-w-[640px] gap-[10px] [grid-template-columns:repeat(auto-fit,minmax(min(190px,100%),1fr))]">
    {choices.map((choice,index)=>{
     const selected=selection===choice.value;
     const order=signInChannelOrder(choice.value).map(channel=>channel==="EMAIL"?"Email":"Phone");
     return <button key={choice.value} type="button" role="radio" aria-checked={selected}
      disabled={!ready||saving||fetching||Boolean(loadError)}
      onClick={()=>setSelection(choice.value)}
      onKeyDown={event=>{
       if(event.key==="ArrowRight"||event.key==="ArrowDown"||event.key==="ArrowLeft"||event.key==="ArrowUp"){
        event.preventDefault();
        const delta=event.key==="ArrowRight"||event.key==="ArrowDown"?1:-1;
        const next=(index+delta+choices.length)%choices.length;
        setSelection(choices[next]!.value);
        const buttons=event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
        buttons?.[next]?.focus();
       }
      }}
      className={"min-w-0 rounded-xl px-[14px] py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a7c88] "+
        (selected?"border-2 border-[#0a7c88] bg-[#f0f9fa]":"border border-[#d9d9d9] bg-white hover:bg-[#f0f9fa]")}>
      <span className="flex min-w-0 items-center justify-between gap-2">
       <span className="text-sm font-semibold text-[#172033]">{choice.label}</span>
       {choice.value==="EMAIL_AND_PHONE"?<span className="shrink-0 rounded-full bg-[#e6f4f5] px-[7px] py-[1px] text-[11px] text-[#075963]">Default</span>:null}
      </span>
      <span className="mt-[2px] block text-[12.5px] text-[#5b6b82]">{choice.hint}</span>
      <span aria-hidden="true" className="mt-[10px] flex gap-[3px] rounded-[7px] border border-[#e7ecf2] bg-[#f1f4f8] p-[3px]">
       {order.map((label,i)=><span key={label}
        className={"min-w-0 flex-1 rounded-[5px] px-1 py-[3px] text-center text-[11px] "+
         (i===0?"bg-white font-semibold text-[#172033] shadow-[0_1px_2px_rgba(16,24,40,0.08)]":"text-[#5b6b82]")}>
        {label}
       </span>)}
      </span>
     </button>;
    })}
   </div>
  </fieldset>
  <p className="text-xs leading-5 text-muted-foreground">
   Saved sign-in method: {choices.find(choice=>choice.value===savedMethod)?.label??savedMethod}
  </p>
  {dirty?<Alert tone="warning">Unsaved sign-in method changes. Save or restore the saved selection before leaving this page.</Alert>:null}
  <Button type="button" disabled={!ready||saving||fetching||Boolean(loadError)||!collegeId}
   onClick={()=>{
    setMessage("");
    if(selection!==savedMethod)setConfirmOpen(true);
    else setMessage("No sign-in method changes to save.");
   }}
   className="min-h-11 w-full justify-center sm:w-auto md:min-h-9 print:hidden" loading={saving}>
   <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
    <path d="M4 3h14l3 3v15H3V3h1zm2 0v7h12V3M7 21v-8h10v8"/>
   </svg>
   Save
  </Button>
  <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!saving)setConfirmOpen(next);}}
   title="Change allowed sign-in methods for this college?"
   description="Current sessions stay signed in." confirmLabel="Save"
   pending={saving} confirmDisabled={!ready||selection===savedMethod} onConfirm={()=>void save()}>
   {message&&messageTone==="error"?<Alert tone="error">{message}</Alert>:null}
  </ConfirmDialog>
  <ConfirmDialog open={reloadPending} onOpenChange={setReloadPending}
   title="Discard unsaved sign-in settings?"
   description="Reloading uses the saved sign-in method and discards your selected change."
   confirmLabel="Discard and reload" confirmVariant="danger"
   onConfirm={()=>void reload(true)}/>
  {message?<Alert tone={messageTone}>{message}</Alert>:null}
 </section>{dialog}</>;
}
