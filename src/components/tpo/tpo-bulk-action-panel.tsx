"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {TpoBulkActionPreview} from "@/components/tpo/tpo-bulk-action-preview";
import type {BulkOutcome,BulkPreviewRow} from "@/modules/placements/tpo-bulk-action-model";
import {selectTpoBulkPage,toggleTpoBulkRow,isTpoBulkPageSelected,TPO_BULK_UI_LIMIT,
  type TpoBulkUiRow} from "@/modules/placements/tpo-bulk-ui-model";

type Action="ELIGIBLE"|"CLEAR_OVERRIDE"|"SHORTLISTED"|"REJECTED";
type PreviewPlan={
 target:"STUDENTS"|"APPLICATIONS";jobId?:string;action:Action;note:string;ids:string[];
};
type PreviewResponse={rows:BulkPreviewRow[];previewToken:string;counts:{ready:number;skipped:number}};
export function TpoBulkActionPanel({target,jobId,rows}:{target:"STUDENTS"|"APPLICATIONS";
 jobId?:string;rows:readonly TpoBulkUiRow[]}){
 const router=useRouter();
 const [selected,setSelected]=useState<string[]>([]);
 const [action,setAction]=useState<Action>(target==="STUDENTS"?"ELIGIBLE":"SHORTLISTED");
 const [note,setNote]=useState("");
 const [preview,setPreview]=useState<PreviewResponse|null>(null);
 const [plan,setPlan]=useState<PreviewPlan|null>(null);
 const [outcomes,setOutcomes]=useState<BulkOutcome[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const permitted=new Set(rows.map(row=>row.id));
 const safeSelected=selected.filter(id=>permitted.has(id));
 function invalidate(){setPreview(null);setPlan(null);setOutcomes([]);setError("");}
 async function post(path:string,payload:unknown){
  const response=await fetch("/api/placements/tpo/bulk-actions/"+path,{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),
  });
  if(!response.ok)throw new Error(response.status===409
    ?"The preview expired or rows changed. Preview again."
    :"The action could not be verified. Review access and try again.");
  return response.json() as Promise<unknown>;
 }
 async function startPreview(){
  if(busy||safeSelected.length===0||safeSelected.length>TPO_BULK_UI_LIMIT)return;
  if(target==="APPLICATIONS"&&note.trim().length<10){
   setError("Provide at least 10 characters of screening context.");return;
  }
  const next:PreviewPlan={
    target,...(target==="APPLICATIONS"?{jobId}:{}),
    action,note:target==="APPLICATIONS"?note.trim():"",ids:safeSelected,
  };
  setBusy(true);invalidate();
  try{
   const result=await post("preview",next) as PreviewResponse;
   if(!Array.isArray(result.rows)||!result.previewToken)throw new Error("Invalid preview");
   setPreview(result);setPlan(next);
  }catch{setError("Preview unavailable. Refresh the roster and try again.");}
  finally{setBusy(false);}
 }
 async function confirm(){
  if(busy||!plan||!preview||preview.counts.ready===0)return;
  setBusy(true);setError("");
  try{
   const response=await post("confirm",{
     ...plan,selections:preview.rows.map(row=>({id:row.id,version:row.version})),
     previewToken:preview.previewToken,confirmed:true,
   }) as {outcomes:BulkOutcome[]};
   if(!Array.isArray(response.outcomes))throw new Error("Missing outcomes");
   setOutcomes(response.outcomes);
   setSelected([]);
   router.refresh();
  }catch{setError("Confirmation failed or some records changed. Preview again before retrying.");setPreview(null);setPlan(null);}
  finally{setBusy(false);}
 }
 const options=target==="STUDENTS"
  ?([{value:"ELIGIBLE",label:"Mark eligible"},{value:"CLEAR_OVERRIDE",label:"Clear direct override"}] as const)
  :([{value:"SHORTLISTED",label:"Shortlist for review"},{value:"REJECTED",label:"Reject with candidate message"}] as const);
 if(rows.length===0)return null;
 return <section aria-label={target==="STUDENTS"?"Bulk student actions":"Bulk application actions"}
   className="space-y-4 rounded-xl border border-border bg-surface p-4">
  <div><h2 className="font-semibold text-foreground">Bulk actions · {target==="STUDENTS"?"Students":"Applications"}</h2>
   <p className="mt-1 text-sm text-body">
    Select up to 25 rows on this page. Preview shows only numbered rows and eligibility.
    Confirmation rechecks permission and versions; existing decisions are audited.
   </p></div>
  <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-2">
   <label className="flex min-h-11 items-center gap-2 p-2 text-sm">
    <input type="checkbox" disabled={busy} checked={isTpoBulkPageSelected(rows.map(row=>row.id),safeSelected)}
     onChange={e=>{setSelected(e.target.checked?selectTpoBulkPage(rows.map(row=>row.id)):[]);invalidate();}}/>
    Select first {Math.min(rows.length,TPO_BULK_UI_LIMIT)} current-page rows
   </label>
   {rows.map(row=><label key={row.id} className="flex min-h-10 items-center gap-2 rounded p-2 text-sm hover:bg-muted">
    <input type="checkbox" disabled={busy} checked={safeSelected.includes(row.id)}
      onChange={e=>{setSelected(current=>toggleTpoBulkRow(current,row.id,e.target.checked));invalidate();}}/>
    <span className="min-w-0 break-words">{row.label}</span>
   </label>)}
  </div>
  <div className="grid gap-3 sm:grid-cols-2">
   <label className="text-sm font-semibold text-body">Action
    <select value={action} disabled={busy}
      onChange={e=>{setAction(e.target.value as Action);invalidate();}}
      className="mt-1 min-h-11 w-full rounded border border-border bg-background px-3">
     {options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
   </label>
   {target==="APPLICATIONS"?<label className="text-sm font-semibold text-body">Review context
    <textarea value={note} disabled={busy} maxLength={1000} rows={2}
      onChange={e=>{setNote(e.target.value);invalidate();}}
      className="mt-1 w-full rounded border border-border bg-background p-3"/>
   </label>:null}
  </div>
  <button type="button" disabled={busy||safeSelected.length===0}
    onClick={()=>void startPreview()}
    className="min-h-11 rounded bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50">
    {busy?"Checking…":"Preview "+safeSelected.length+" selected"}
  </button>
  {preview&&plan?<TpoBulkActionPreview rows={preview.rows} outcomes={outcomes}
    busy={busy||outcomes.length>0} onConfirm={()=>void confirm()}/>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
