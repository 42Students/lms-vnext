"use client";
import {useRouter} from "next/navigation";
import {useRef,useState} from "react";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {TpoBatchUndoControl} from "./tpo-batch-undo-control";
import {serializeTpoEligibilityPreviewCsv} from "@/modules/placements/tpo-eligibility-preview-csv-model";
import {parseTpoEligibilitySheetCsv} from "@/modules/placements/tpo-eligibility-sheet-model";
type ImportRow=ReturnType<typeof parseTpoEligibilitySheetCsv>[number];
type Preview={rows:ImportRow[];ready:number;skipped:number;preview:{
 index:number;status:"matched"|"unusable";reason:string|null;membershipId:string|null;expectedVersion:string|null;
 studentName?:string|null;rollNumber?:string|null;currentStatus?:string|null;proposedStatus?:string|null;
}[]};
export function TpoBatchEligibilityImport({batchId}:{batchId:string}){
 const fileInput=useRef<HTMLInputElement>(null),dialog=useRef<HTMLDialogElement>(null);
 const router=useRouter(),[csv,setCsv]=useState("studentCode,decision,reason\n");
 const [preview,setPreview]=useState<Preview|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [lastActionId,setLastActionId]=useState<string|null>(null);
 const [skippedByUser,setSkippedByUser]=useState<number[]>([]);
 const [previewTab,setPreviewTab]=useState<"ALL"|"MATCHED"|"UNUSABLE">("ALL");
 const [chosenName,setChosenName]=useState("");
 const [previewPage,setPreviewPage]=useState(1);
 const [acknowledged,setAcknowledged]=useState(false);
 const unresolved=preview?.preview.filter((row,index)=>row.status==="unusable"&&!skippedByUser.includes(index)).length??0;
 async function chooseFile(file:File|null){
  if(!file)return;
  setError("");setPreview(null);setNotice("");setLastActionId(null);setPreviewPage(1);setAcknowledged(false);
  if(!file.name.toLowerCase().endsWith(".csv")) {
    setError("Choose a CSV export of the spreadsheet (.csv).");return;
  }
  if(file.size>1_500_000){setError("CSV file is larger than 1.5 MB.");return;}
  try{setCsv(await file.text());setChosenName(file.name);}
  catch{setError("Unable to read the selected CSV file.");}
 }
 async function previewChanges(){
  if(busy)return;setBusy(true);setError("");setNotice("");setPreview(null);setSkippedByUser([]);setAcknowledged(false);
  try{
   const rows=parseTpoEligibilitySheetCsv(csv);
   const value=await apiFetch<Preview>("/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/import-preview",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({rows}),
   });
   setPreview(value);setPreviewPage(1);
  }catch(e){setError(e instanceof FriendlyFetchError&&e.status===409?
    "This changed while you were working. Your import is still here; preview it again.":
    e instanceof Error?e.message:friendlyApiError({}));}finally{setBusy(false);}
 }
 async function copyPreview(){
  if(!preview||busy)return;
  try{
   await navigator.clipboard.writeText(serializeTpoEligibilityPreviewCsv(preview.rows,preview.preview));
   setError("");setNotice("Current import preview copied as CSV. Nothing was submitted.");
  }catch{setError("Could not copy this preview. Review the result list instead.");}
 }
 async function commit(){
  if(!preview||preview.ready===0||busy||!acknowledged)return;
  if(unresolved>0){setError(unresolved+" row(s) need attention before you can confirm. Pick a suggestion or skip the row.");return;}
  const selections=preview.preview.map((row,index)=>({row,index}))
    .filter(item=>!skippedByUser.includes(item.index));
  const selected=selections.filter(item=>item.row.status==="matched");
  if(!selected.length){setError("Select at least one matched row to import.");return;}
  setBusy(true);setError("");setNotice("");
  try{
   const versions=Object.fromEntries(selected.filter(({row})=>row.membershipId&&row.expectedVersion)
    .map(({row})=>[row.membershipId!,row.expectedVersion!]));
   const data=await apiFetch<{changedCount?:number;skipped?:number;actionId?:string|null}>("/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/import-commit",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({rows:selections.map(item=>preview.rows[item.index]),expectedVersions:versions,previewMemberIds:selections.map(item=>item.row.membershipId),confirmed:true}),
   });
   setLastActionId(data.actionId??null);
   setNotice("Import saved");
   setPreview(null);setAcknowledged(false);router.refresh();
  }catch(e){setError(e instanceof FriendlyFetchError&&e.status===409?
    "This changed while you were working. Your import is still here; preview it again.":
    e instanceof Error?e.message:friendlyApiError({}));}
  finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-3 rounded-lg border border-border bg-surface p-4">
  <h2 className="font-semibold">Import eligibility decisions</h2>
  <button type="button" disabled={busy} onClick={()=>dialog.current?.showModal()}
   className="min-h-11 rounded border border-border px-4 text-sm font-semibold text-primary-text">
   Import eligibility decisions
  </button>
  <dialog ref={dialog} aria-label="Import eligibility decisions"
   onCancel={event=>{if(busy)event.preventDefault();}}
   className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl space-y-3 overflow-y-auto rounded-xl border border-border bg-surface p-5 text-foreground backdrop:bg-black/40">
   <div className="flex items-center justify-between gap-3">
    <h3 className="font-semibold">Import eligibility</h3>
    <button type="button" disabled={busy} onClick={()=>dialog.current?.close()}
     className="min-h-10 rounded border border-border px-3">Close</button>
   </div>
  <p className="text-sm text-muted-foreground">CSV columns: studentCode,decision,reason. studentCode may be an exact roll number or learner membership UUID; ambiguous rolls are skipped. Names and emails are never used for matching. Up to 5000 records. Supports quoted commas, legacy column names, Yes/No and clear/reset decisions.</p>
  <div className="rounded-md border border-dashed border-border p-3"
   onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();void chooseFile(event.dataTransfer.files.item(0));}}>
   <label className="block text-sm font-semibold text-body">Choose or drop eligibility CSV
    <input ref={fileInput} type="file" accept=".csv,text/csv" disabled={busy}
     className="mt-2 block min-h-11 max-w-full text-sm" onChange={event=>void chooseFile(event.target.files?.[0]??null)}/>
   </label>
   {chosenName?<p className="text-xs text-muted-foreground">Selected: {chosenName}</p>:null}
   <p className="text-xs text-muted-foreground">For Excel files, use Save As → CSV (UTF-8) before import.</p>
  </div>
  <label className="block text-sm">CSV contents
   <textarea className="mt-1 min-h-32 w-full min-w-0 rounded border border-border bg-surface p-2 font-mono text-xs"
    value={csv} onChange={e=>{setCsv(e.target.value);setPreview(null);setNotice("");}} disabled={busy} maxLength={1500000}/>
  </label>
  <button type="button" disabled={busy} onClick={()=>void previewChanges()} className="min-h-11 rounded border border-border px-4 text-sm">{busy?"Working…":"Preview import"}</button>
  {preview?<div className="space-y-2">
   <p role="status" className="text-sm font-semibold">{preview.ready} matched; {preview.skipped} cannot use.</p>
   {unresolved>0?<p role="alert" className="text-sm text-warning-text">{unresolved} row(s) need attention before you can confirm. Pick a suggestion or skip the row.</p>:null}
   <div role="tablist" aria-label="Import preview filters" className="flex flex-wrap gap-2">
    {(["ALL","MATCHED","UNUSABLE"] as const).map(tab=><button key={tab} type="button" role="tab"
     aria-selected={previewTab===tab} onClick={()=>{setPreviewTab(tab);setPreviewPage(1);}}
     className="min-h-10 rounded border border-border px-3 text-xs font-semibold text-primary-text">
     {tab==="ALL"?"All":tab==="MATCHED"?"Matched":"Can't use"}</button>)}
   </div>
   <ul className="max-h-96 space-y-1 overflow-y-auto text-xs">{preview.preview.map((row,i)=>({row,i}))
    .filter(({row})=>previewTab==="ALL"||row.status===(previewTab==="MATCHED"?"matched":"unusable"))
    .slice((previewPage-1)*8,previewPage*8)
    .map(({row,i})=><li className="min-w-0 break-all rounded border border-border p-2" key={i}>
    {row.status==="unusable"?<button type="button" disabled={busy||skippedByUser.includes(i)}
     onClick={()=>setSkippedByUser(current=>current.includes(i)?current:[...current,i])}
     className="mr-2 min-h-9 rounded border border-border px-2 text-primary-text">
     {skippedByUser.includes(i)?"Row skipped":"Skip row"}</button>:
     <label className="mr-2 inline-flex items-center gap-1"><input type="checkbox" checked={!skippedByUser.includes(i)} onChange={event=>setSkippedByUser(current=>event.target.checked?current.filter(x=>x!==i):[...current,i])} disabled={busy}/>Include</label>}
    <strong>Row {i+1}: {row.studentName??preview.rows[i]?.studentCode}</strong>
    <p>Roll: {row.rollNumber??preview.rows[i]?.studentCode} · Current: {row.currentStatus??"—"} · Becomes: {row.proposedStatus??"—"}</p>
    <p>{row.status==="matched"&&row.currentStatus===row.proposedStatus?
      "No change":row.status==="matched"?"Matched":"Can't use"}{row.reason?" — "+row.reason:""}</p>
   </li>)}</ul>
   <nav aria-label="Import preview pages" className="flex flex-wrap items-center gap-3 text-xs">
    <button type="button" disabled={busy||previewPage===1} onClick={()=>setPreviewPage(p=>Math.max(1,p-1))} className="min-h-10 rounded border border-border px-3 disabled:opacity-50">Previous</button>
    <span>Page {previewPage} of {Math.max(1,Math.ceil(preview.preview.filter(row=>previewTab==="ALL"||row.status===(previewTab==="MATCHED"?"matched":"unusable")).length/8))}</span>
    <button type="button" disabled={busy||previewPage*8>=preview.preview.filter(row=>previewTab==="ALL"||row.status===(previewTab==="MATCHED"?"matched":"unusable")).length} onClick={()=>setPreviewPage(p=>p+1)} className="min-h-10 rounded border border-border px-3 disabled:opacity-50">Next</button>
   </nav>
   <div className="flex flex-wrap gap-2">
    <button type="button" disabled={busy} onClick={()=>fileInput.current?.click()} className="min-h-10 rounded border border-border px-3 text-sm">Choose another file</button>
    <button type="button" disabled={busy} onClick={()=>{setPreview(null);setSkippedByUser([]);setNotice("Review discarded. No changes were saved.");}} className="min-h-10 rounded border border-border px-3 text-sm">Discard review</button>
   </div>
   <button type="button" disabled={busy} onClick={()=>void copyPreview()} className="min-h-11 rounded border border-border px-4 text-sm">Copy preview outcomes CSV</button>
   <label className="flex items-start gap-2 text-sm text-body">
     <input type="checkbox" className="mt-1 h-4 w-4 accent-primary"
       checked={acknowledged} disabled={busy}
       onChange={event=>setAcknowledged(event.target.checked)}/>
     I reviewed the matched learners and understand that applying these decisions will be audited.
     Unusable rows must be explicitly skipped before the matched decisions can be saved.
   </label>
   <button type="button" disabled={busy||preview.ready===0||unresolved>0||!acknowledged} onClick={()=>void commit()}
    className="min-h-11 rounded bg-primary px-4 text-sm text-on-primary disabled:opacity-50">Confirm matched decisions</button>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
  {lastActionId?<TpoBatchUndoControl batchId={batchId} actionId={lastActionId}/>:null}
  </dialog>
 </section>;
}
