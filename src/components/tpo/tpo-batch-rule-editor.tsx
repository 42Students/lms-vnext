"use client";
import {Button} from "@/components/ui/button";
import {Banner} from "@/components/ui/banner";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import type {TpoBatchRuleFields,TpoBatchRuleOverrides} from "@/modules/placements/tpo-batch-rules-model";

export function TpoBatchRuleEditor({batchId,batchName,college,initialOverride,expectedVersion,readOnly}:{
 batchId:string;batchName:string;college:TpoBatchRuleFields;initialOverride:TpoBatchRuleOverrides;
 expectedVersion:string;readOnly:boolean;
}){
 const router=useRouter(),{run}=useGuardedAction({timeoutMs:35000});
 const [draft,setDraft]=useState<TpoBatchRuleOverrides>(initialOverride);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [expected,setExpected]=useState(expectedVersion);
 const [baseline,setBaseline]=useState<TpoBatchRuleOverrides>(initialOverride);
 const [pendingHref,setPendingHref]=useState<string|null>(null);
 const changed=JSON.stringify(draft)!==JSON.stringify(baseline);
 useEffect(()=>{
  if(!changed||busy)return;
  const currentUrl=window.location.href;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  const onClick=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   const element=event.target;
   const anchor=element instanceof Element?element.closest("a[href]"):null;
   if(!(anchor instanceof HTMLAnchorElement)||anchor.target==="_blank"||anchor.hasAttribute("download"))return;
   const destination=new URL(anchor.href,window.location.href);
   if(destination.origin!==window.location.origin)return;
   if(destination.pathname===window.location.pathname&&destination.search===window.location.search)return;
   event.preventDefault();event.stopPropagation();
   setPendingHref(destination.pathname+destination.search+destination.hash);
  };
  const onPopState=()=>{
   const destination=window.location.pathname+window.location.search+window.location.hash;
   window.history.pushState(null,"",currentUrl);
   setPendingHref(destination);
  };
  window.addEventListener("beforeunload",warn);
  document.addEventListener("click",onClick,true);
  window.addEventListener("popstate",onPopState);
  return ()=>{
   window.removeEventListener("beforeunload",warn);
   document.removeEventListener("click",onClick,true);
   window.removeEventListener("popstate",onPopState);
  };
 },[changed,busy]);
 function setRule<K extends keyof TpoBatchRuleFields>(key:K,value:TpoBatchRuleFields[K]){
  setDraft(current=>{
   const next={...current};
   if(value===college[key])delete next[key];else next[key]=value;
   return next;
  });
  setNotice("");
 }
 async function save(values:TpoBatchRuleOverrides){
  if(busy||readOnly)return;
  await run(async()=>{
   setBusy(true);setError("");setNotice("");
   try{
    const response=await apiFetch<{version:string}>("/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/rules",{
     method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({rulesOverride:values,expectedVersion:expected}),
    });
    setExpected(response.version);
    setDraft(values);
    setBaseline(values);
    setNotice(Object.keys(values).length?"Rules saved for "+batchName:batchName+" follows the college rules");
    router.refresh();
   }catch(cause){
    setError(cause instanceof FriendlyFetchError&&cause.status===409?
     "Batch rules changed while you were editing. Refresh and review the latest values before saving.":
     cause instanceof Error?cause.message:friendlyApiError({}));
   }finally{setBusy(false);}
  });
 }
 const number=(key:"maxHeldOffers"|"upliftPct"|"minResponseHours",label:string,min:number,max:number,suffix:string)=>
  <div key={key} className="flex flex-wrap items-end justify-between gap-3 border-t border-border py-3">
   <div><strong className="text-sm">{label}</strong>
    <p className="text-xs text-body">College: {college[key]} {suffix}</p>
   </div>
   <div className="flex flex-wrap items-center gap-2">
    <Input className="min-h-11 w-24 md:min-h-9" type="number" min={min} max={max} step={1} disabled={busy||readOnly}
     aria-label={label} value={draft[key]??college[key]}
     onChange={event=>setRule(key,Number(event.target.value))}
     />
    {draft[key]!==undefined?<Button variant="ghost" className="lms-inline-link min-h-11 text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9" type="button" disabled={busy||readOnly}
     onClick={()=>setRule(key,college[key])}
     >Use the college&apos;s</Button>:null}
   </div>
  </div>;
 return <section aria-label="Batch placement rules" className="min-w-0 space-y-3 border-y border-border py-4">
  <h2 className="font-semibold">Batch placement rules</h2>
  <p className="text-sm text-body">{Object.keys(draft).length?batchName+" has its own rules":batchName+" follows the college rules"}</p>
  <p className="text-sm text-body">Change a rule only for this batch; everything you leave alone stays the college&apos;s. An internship offer never counts as placed.</p>
  <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border py-3">
   <div><strong className="text-sm">Counts as placed when</strong>
    <p className="text-xs text-body">College: {college.countsAsPlacedAt==="OFFER_ACCEPTED"?"the offer is accepted":"the offer is released"}</p>
   </div>
   <div className="flex flex-wrap items-center gap-2">
    <Select className="min-h-11 w-auto max-w-full md:min-h-9" aria-label="Counts as placed when" disabled={busy||readOnly}
     value={draft.countsAsPlacedAt??college.countsAsPlacedAt}
     onChange={event=>setRule("countsAsPlacedAt",event.target.value as TpoBatchRuleFields["countsAsPlacedAt"])}
     >
     <option value="OFFER_RELEASED">the offer is released</option>
     <option value="OFFER_ACCEPTED">the offer is accepted</option>
    </Select>
    {draft.countsAsPlacedAt!==undefined?<Button variant="ghost" className="lms-inline-link min-h-11 text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9" type="button" disabled={busy||readOnly}
     onClick={()=>setRule("countsAsPlacedAt",college.countsAsPlacedAt)}
     >Use the college&apos;s</Button>:null}
   </div>
  </div>
  {number("maxHeldOffers","Offers a student can hold",1,5,"offers")}
  {number("upliftPct","Once placed, can apply again for at least",0,200,"% more CTC")}
  {number("minResponseHours","Time to respond to an offer",12,168,"hours")}
  {readOnly?<p role="status" className="text-sm">Finished batches cannot change placement rules.</p>:null}
  <div className="flex flex-wrap gap-3">
   <Button type="button" disabled={readOnly||busy||!changed}
    onClick={()=>void save(draft)} >
    {busy?"Saving…":"Save"}</Button>
   {Object.keys(draft).length>0?<Button variant="secondary" type="button" disabled={busy||readOnly}
    onClick={()=>void save({})} >
    Follow the college rules</Button>:null}
  </div>
  {changed?<Banner tone="warning">Unsaved batch-rule changes. Review before leaving.</Banner>:null}
  {error?<InlineNotice tone="error" message={"Batch rules were not saved. "+error}/>:null}
  {notice?<InlineNotice tone="success" message={notice}/>:null}
  <ConfirmDialog open={pendingHref!==null} onOpenChange={open=>{if(!open)setPendingHref(null);}}
    title="Discard your unsaved batch-rule changes?"
    description="Unsaved batch-rule changes. Review before leaving."
    confirmLabel="Discard changes" confirmVariant="danger"
    onConfirm={()=>{
     if(!pendingHref)return;
     const destination=pendingHref;
     setPendingHref(null);
     router.push(destination);
    }}/>
 </section>;
}
