"use client";
import {Button} from "@/components/ui/button";
import {Radio} from "@/components/ui/radio";
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
 {value:"EMAIL_AND_PHONE",label:"Email and phone (default)",hint:"Email first; phone also available"},
 {value:"PHONE_AND_EMAIL",label:"Phone and email",hint:"Phone first; email also available"},
 {value:"EMAIL_ONLY",label:"Email only",hint:"Only email one-time codes on this college host"},
 {value:"PHONE_ONLY",label:"Phone only",hint:"Only phone one-time codes on this college host"},
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
 async function save(){
  if(!ready||saving||selection===savedMethod)return;
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
 return <><section aria-label="College sign-in methods" className="min-w-0 max-w-3xl space-y-[var(--lms-space-4)] border-t border-border pt-[var(--lms-space-4)]">
  <h2 className="text-base font-semibold text-[var(--lms-heading)]">Sign-in method</h2>
  {!ready?<Alert tone="warning">Sign-in method storage is unavailable; changes are disabled.</Alert>:null}
  <fieldset disabled={!ready||saving} className="grid min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)] print:hidden">
   <legend className="sr-only">Sign-in method</legend>
   {choices.map(choice=><label key={choice.value} className={"flex min-h-14 min-w-0 items-center gap-[var(--lms-space-3)] px-[var(--lms-space-3)] py-[var(--lms-space-3)] transition-colors duration-150 focus-within:outline-2 focus-within:outline-offset-[-2px] focus-within:outline-[var(--lms-primary-text)] "+(!ready||saving?"cursor-not-allowed opacity-60 ":"cursor-pointer ")+(selection===choice.value?"bg-primary-subtle":!ready||saving?"bg-surface":"bg-surface hover:bg-primary-subtle")}>
    <Radio className="size-5" name="signin-method" value={choice.value}
     checked={selection===choice.value} onChange={()=>setSelection(choice.value)}/>
    <span className="min-w-0"><strong className="block break-words text-sm">{choice.label}</strong><span className="text-xs text-muted-foreground">{choice.hint}</span></span>
   </label>)}
  </fieldset>
  <section aria-label="Sign-in order preview" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3">
    <h3 className="mb-2 text-sm font-semibold text-foreground">Sign-in preview</h3>
    <ol className="flex flex-wrap items-center gap-2" aria-label="One-time-code channel order">
      {signInChannelOrder(selection).map((channel,index)=><li key={channel}
        className="rounded-[var(--lms-control-radius)] border border-border bg-primary-subtle px-3 py-2 text-xs font-semibold text-primary-text">
        {index+1}. {channel==="EMAIL"?"Email one-time code":"Phone one-time code"}
      </li>)}
    </ol>
  </section>
  <p className="text-xs leading-5 text-muted-foreground">Saved sign-in method: {choices.find(choice=>choice.value===savedMethod)?.label??savedMethod}</p>
  {dirty?<Alert tone="warning">Unsaved sign-in method changes. Save or restore the saved selection before leaving this page.</Alert>:null}
  <Button type="button" disabled={!ready||saving||selection===savedMethod} onClick={()=>{setMessage("");setConfirmOpen(true);}}
   className="min-h-11 w-full md:min-h-9 md:w-auto print:hidden" loading={saving}>
   {saving?"Saving…":"Save sign-in settings"}
  </Button>
  <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!saving)setConfirmOpen(next);}} title="Change allowed sign-in methods for this college?" description="Current sessions stay signed in." confirmLabel="Save sign-in settings" pending={saving} confirmDisabled={!ready||selection===savedMethod} onConfirm={()=>void save()}>
    {message&&messageTone==="error"?<Alert tone="error">{message}</Alert>:null}
  </ConfirmDialog>
  {message?<Alert tone={messageTone}>{message}</Alert>:null}
 </section>{dialog}</>;
}
