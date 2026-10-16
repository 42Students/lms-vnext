"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {TpoBatchUndoControl} from "./tpo-batch-undo-control";
import {serializeTpoEligibilityPreviewCsv} from "@/modules/placements/tpo-eligibility-preview-csv-model";
import {parseTpoEligibilitySheetCsv} from "@/modules/placements/tpo-eligibility-sheet-model";
type ImportRow=ReturnType<typeof parseTpoEligibilitySheetCsv>[number];
type Preview={rows:ImportRow[];ready:number;skipped:number;preview:{
 index:number;status:"matched"|"unusable";reason:string|null;membershipId:string|null;expectedVersion:string|null;
}[]};
export function TpoBatchEligibilityImport({batchId}:{batchId:string}){
 const router=useRouter(),[csv,setCsv]=useState("studentCode,decision,reason\n");
 const [preview,setPreview]=useState<Preview|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [lastActionId,setLastActionId]=useState<string|null>(null);
 const [skippedByUser,setSkippedByUser]=useState<number[]>([]);
 const [chosenName,setChosenName]=useState("");
 async function chooseFile(file:File|null){
  if(!file)return;
  setError("");setPreview(null);setNotice("");
  if(!file.name.toLowerCase().endsWith(".csv")) {
    setError("Choose a CSV export of the spreadsheet (.csv).");return;
  }
  if(file.size>1_500_000){setError("CSV file is larger than 1.5 MB.");return;}
  try{setCsv(await file.text());setChosenName(file.name);}
  catch{setError("Unable to read the selected CSV file.");}
 }
 async function previewChanges(){
  if(busy)return;setBusy(true);setError("");setNotice("");setPreview(null);setSkippedByUser([]);
  try{
   const rows=parseTpoEligibilitySheetCsv(csv);
   const response=await fetch("/api/placements/tpo/batches/"+batchId+"/import-preview",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({rows}),
   });
   const value=await response.json() as Preview&{error?:string};
   if(!response.ok)throw Error(value.error??"Import preview failed.");
   setPreview(value);
  }catch(e){setError(e instanceof Error?e.message:"Preview unavailable.");}finally{setBusy(false);}
 }
 async function copyPreview(){
  if(!preview||busy)return;
  try{
   await navigator.clipboard.writeText(serializeTpoEligibilityPreviewCsv(preview.rows,preview.preview));
   setError("");setNotice("Current import preview copied as CSV. Nothing was submitted.");
  }catch{setError("Could not copy this preview. Review the result list instead.");}
 }
 async function commit(){
  if(!preview||preview.ready===0||busy)return;
  const selections=preview.preview.map((row,index)=>({row,index}))
    .filter(item=>!skippedByUser.includes(item.index));
  const selected=selections.filter(item=>item.row.status==="matched");
  if(!selected.length){setError("Select at least one matched row to import.");return;}
  if(!window.confirm("Apply "+selected.length+" matched eligibility decisions? The remaining rows will be skipped."))return;
  setBusy(true);setError("");setNotice("");
  try{
   const versions=Object.fromEntries(selected.filter(({row})=>row.membershipId&&row.expectedVersion)
    .map(({row})=>[row.membershipId!,row.expectedVersion!]));
   const response=await fetch("/api/placements/tpo/batches/"+batchId+"/import-commit",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({rows:selections.map(item=>preview.rows[item.index]),expectedVersions:versions,previewMemberIds:selections.map(item=>item.row.membershipId),confirmed:true}),
   });
   const data=await response.json() as {changedCount?:number;skipped?:number;actionId?:string|null;error?:string};
   if(!response.ok)throw Error(response.status===409?"Preview became stale. Review the latest eligibility decisions and preview again.":data.error??"Import failed.");
   setLastActionId(data.actionId??null);
   setNotice((data.changedCount??0)+" changes saved; "+(data.skipped??0)+" skipped."+(data.actionId?" Action ID: "+data.actionId:""));
   setPreview(null);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Import could not be confirmed.");}
  finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-3 rounded-lg border border-border bg-surface p-4">
  <h2 className="font-semibold">Import eligibility decisions</h2>
  <p className="text-sm text-muted-foreground">CSV columns: studentCode,decision,reason. studentCode may be an exact roll number or learner membership UUID; ambiguous rolls are skipped. Names and emails are never used for matching. Up to 5000 records. Supports quoted commas, legacy column names, Yes/No and clear/reset decisions.</p>
  <div className="rounded-md border border-dashed border-border p-3"
   onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();void chooseFile(event.dataTransfer.files.item(0));}}>
   <label className="block text-sm font-semibold text-body">Choose or drop eligibility CSV
    <input type="file" accept=".csv,text/csv" disabled={busy}
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
   <ul className="max-h-64 space-y-1 overflow-y-auto text-xs">{preview.preview.map((row,i)=><li className="min-w-0 break-all rounded border border-border p-2" key={i}>
    <label className="mr-2 inline-flex items-center gap-1"><input type="checkbox" checked={!skippedByUser.includes(i)} onChange={event=>setSkippedByUser(current=>event.target.checked?current.filter(x=>x!==i):[...current,i])} disabled={busy||row.status!=="matched"}/>Include</label>
    Row {i+1}: {row.status==="matched"?"Will update":"Skipped"} {preview.rows[i]?.studentCode}{row.reason?" — "+row.reason:""}
   </li>)}</ul>
   <button type="button" disabled={busy} onClick={()=>void copyPreview()} className="min-h-11 rounded border border-border px-4 text-sm">Copy preview outcomes CSV</button>
   <button type="button" disabled={busy||preview.ready===0} onClick={()=>void commit()}
    className="min-h-11 rounded bg-primary px-4 text-sm text-on-primary disabled:opacity-50">Confirm matched decisions</button>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
  {lastActionId?<TpoBatchUndoControl batchId={batchId} actionId={lastActionId}/>:null}
 </section>;
}
