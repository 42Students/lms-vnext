"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import type {TpoBatchRuleFields,TpoBatchRuleOverrides} from "@/modules/placements/tpo-batch-rules-model";

export function TpoBatchRuleEditor({batchId,batchName,college,initialOverride,expectedVersion,readOnly}:{
 batchId:string;batchName:string;college:TpoBatchRuleFields;initialOverride:TpoBatchRuleOverrides;
 expectedVersion:string;readOnly:boolean;
}){
 const router=useRouter(),{run}=useGuardedAction({timeoutMs:35000});
 const [draft,setDraft]=useState<TpoBatchRuleOverrides>(initialOverride);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [expected,setExpected]=useState(expectedVersion);
 const changed=JSON.stringify(draft)!==JSON.stringify(initialOverride);
 useEffect(()=>{
  if(!changed)return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[changed]);
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
    <input type="number" min={min} max={max} step={1} disabled={busy||readOnly}
     aria-label={label} value={draft[key]??college[key]}
     onChange={event=>setRule(key,Number(event.target.value))}
     className="min-h-11 w-24 rounded border border-border bg-surface p-2"/>
    {draft[key]!==undefined?<button type="button" disabled={busy||readOnly}
     onClick={()=>setRule(key,college[key])}
     className="min-h-10 text-sm text-primary-text underline">Use the college&apos;s</button>:null}
   </div>
  </div>;
 return <section aria-label="Batch placement rules" className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold">Batch placement rules</h2>
  <p className="text-sm text-body">{Object.keys(draft).length?batchName+" has its own rules":batchName+" follows the college rules"}</p>
  <p className="text-sm text-body">Change a rule only for this batch; everything you leave alone stays the college&apos;s. An internship offer never counts as placed.</p>
  <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border py-3">
   <div><strong className="text-sm">Counts as placed when</strong>
    <p className="text-xs text-body">College: {college.countsAsPlacedAt==="OFFER_ACCEPTED"?"the offer is accepted":"the offer is released"}</p>
   </div>
   <div className="flex flex-wrap items-center gap-2">
    <select aria-label="Counts as placed when" disabled={busy||readOnly}
     value={draft.countsAsPlacedAt??college.countsAsPlacedAt}
     onChange={event=>setRule("countsAsPlacedAt",event.target.value as TpoBatchRuleFields["countsAsPlacedAt"])}
     className="min-h-11 rounded border border-border bg-surface p-2">
     <option value="OFFER_RELEASED">the offer is released</option>
     <option value="OFFER_ACCEPTED">the offer is accepted</option>
    </select>
    {draft.countsAsPlacedAt!==undefined?<button type="button" disabled={busy||readOnly}
     onClick={()=>setRule("countsAsPlacedAt",college.countsAsPlacedAt)}
     className="min-h-10 text-sm text-primary-text underline">Use the college&apos;s</button>:null}
   </div>
  </div>
  {number("maxHeldOffers","Offers a student can hold",1,5,"offers")}
  {number("upliftPct","Once placed, can apply again for at least",0,200,"% more CTC")}
  {number("minResponseHours","Time to respond to an offer",12,168,"hours")}
  {readOnly?<p role="status" className="text-sm">Finished batches cannot change placement rules.</p>:null}
  <div className="flex flex-wrap gap-3">
   <button type="button" disabled={readOnly||busy||!changed}
    onClick={()=>void save(draft)} className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
    {busy?"Saving…":"Save"}</button>
   {Object.keys(draft).length>0?<button type="button" disabled={busy||readOnly}
    onClick={()=>void save({})} className="min-h-11 rounded border border-border px-3 text-sm text-primary-text">
    Follow the college rules</button>:null}
  </div>
  {changed?<p role="status" className="text-xs text-warning">Unsaved batch-rule changes. Review before leaving.</p>:null}
  {error?<p role="alert" className="text-sm text-error">Batch rules were not saved. {error}</p>:null}
  {notice?<p role="status" className="text-sm text-success">{notice}</p>:null}
 </section>;
}
