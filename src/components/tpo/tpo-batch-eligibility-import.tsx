"use client";
import {Checkbox} from "@/components/ui/checkbox";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {useRef,useState} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Drawer} from "@/components/ui/drawer";
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
 const fileInput=useRef<HTMLInputElement>(null);
 // Synchronous lock prevents double submits before a React busy-state render.
 const actionInFlight=useRef(false);
 const [importOpen,setImportOpen]=useState(false);
 const router=useRouter(),[csv,setCsv]=useState("studentCode,decision,reason\n");
 const [preview,setPreview]=useState<Preview|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [lastActionId,setLastActionId]=useState<string|null>(null);
 const [skippedByUser,setSkippedByUser]=useState<number[]>([]);
 const [previewTab,setPreviewTab]=useState<"ALL"|"MATCHED"|"UNUSABLE">("ALL");
 const [chosenName,setChosenName]=useState("");
 const [previewPage,setPreviewPage]=useState(1);
 const [acknowledged,setAcknowledged]=useState(false);
 const [discardPending,setDiscardPending]=useState(false);
 const unresolved=preview?.preview.filter((row,index)=>row.status==="unusable"&&!skippedByUser.includes(index)).length??0;
 async function chooseFile(file:File|null){
  if(!file||actionInFlight.current)return;
  setError("");setPreview(null);setNotice("");setLastActionId(null);setPreviewPage(1);setAcknowledged(false);setChosenName("");
  if(!file.name.toLowerCase().endsWith(".csv")) {
    setError("Choose a CSV export of the spreadsheet (.csv).");return;
  }
  if(file.size>1_500_000){setError("CSV file is larger than 1.5 MB.");return;}
  try{setCsv(await file.text());setChosenName(file.name);}
  catch{setError("Unable to read the selected CSV file.");}
 }
 async function previewChanges(){
  if(busy||actionInFlight.current)return;
  actionInFlight.current=true;setBusy(true);setError("");setNotice("");setPreview(null);setSkippedByUser([]);setAcknowledged(false);
  try{
   const rows=parseTpoEligibilitySheetCsv(csv);
   const value=await apiFetch<Preview>("/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/import-preview",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({rows}),
   });
   setPreview(value);setPreviewPage(1);
  }catch(e){setError(e instanceof FriendlyFetchError&&e.status===409?
    "This changed while you were working. Your import is still here; preview it again.":
    e instanceof FriendlyFetchError?e.message:friendlyApiError({}));}finally{actionInFlight.current=false;setBusy(false);}
 }
 async function copyPreview(){
  if(!preview||busy)return;
  try{
   await navigator.clipboard.writeText(serializeTpoEligibilityPreviewCsv(preview.rows,preview.preview));
   setError("");setNotice("Current import preview copied as CSV. Nothing was submitted.");
  }catch{setError("Could not copy this preview. Review the result list instead.");}
 }
 async function commit(){
  if(!preview||preview.ready===0||busy||actionInFlight.current||!acknowledged)return;
  if(unresolved>0){setError(unresolved+" row(s) need attention before you can confirm. Pick a suggestion or skip the row.");return;}
  const selections=preview.preview.map((row,index)=>({row,index}))
    .filter(item=>!skippedByUser.includes(item.index));
  const selected=selections.filter(item=>item.row.status==="matched");
  if(!selected.length){setError("Select at least one matched row to import.");return;}
  actionInFlight.current=true;setBusy(true);setError("");setNotice("");
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
    e instanceof FriendlyFetchError?e.message:friendlyApiError({}));}
  finally{actionInFlight.current=false;setBusy(false);}
 }
 return <section className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
  <h2 className="font-semibold">Import eligibility</h2>
  <Button variant="secondary" type="button" disabled={busy} onClick={()=>setImportOpen(true)}
   >
   Import eligibility decisions
  </Button>
  <Drawer open={importOpen} onOpenChange={setImportOpen} title="Import eligibility decisions"
    dismissible={!busy}><div className="space-y-3">
   <div className="flex items-center justify-between gap-3">
    <h3 className="font-semibold">Import eligibility</h3>
    <Button variant="secondary" type="button" disabled={busy} onClick={()=>setImportOpen(false)}
     >Close</Button>
   </div>
  <p className="text-sm text-muted-foreground">CSV columns: studentCode,decision,reason. studentCode may be an exact roll number or learner membership UUID; ambiguous rolls are skipped. Names and emails are never used for matching. Up to 5000 records. Supports quoted commas, legacy column names, Yes/No and clear/reset decisions.</p>
  <div className="rounded-[var(--lms-canvas-radius)] border border-dashed border-border p-3"
   onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();void chooseFile(event.dataTransfer.files.item(0));}}>
   <label className="block text-sm font-semibold text-body">Choose or drop eligibility CSV
    <input ref={fileInput} type="file" accept=".csv,text/csv" disabled={busy}
     className="mt-2 block min-h-9 max-w-full text-sm" onChange={event=>void chooseFile(event.target.files?.[0]??null)}/>
   </label>
   {chosenName?<p className="text-xs text-muted-foreground">Selected: {chosenName}</p>:null}
   <p className="text-xs text-muted-foreground">For Excel files, use Save As → CSV (UTF-8) before import.</p>
   <a download="eligibility-import-template.csv" href="data:text/csv;charset=utf-8,studentCode%2Cdecision%2Creason%0A" className="inline-flex min-h-9 items-center text-sm font-semibold text-link underline">Download a template</a>
  </div>
  <label className="block text-sm">CSV contents
   <Textarea className="mt-1 min-h-32 font-mono text-xs"
    value={csv} onChange={e=>{setCsv(e.target.value);setPreview(null);setNotice("");}} disabled={busy} maxLength={1500000}/>
  </label>
  <Button variant="secondary" type="button" disabled={busy} onClick={()=>void previewChanges()} >{busy?"Working…":"Preview import"}</Button>
  {preview?<div className="space-y-2">
   <p role="status" className="text-sm font-semibold">{preview.ready} matched; {preview.skipped} cannot use.</p>
   {unresolved>0?<p role="alert" className="text-sm text-warning-text">{unresolved} row(s) need attention before you can confirm. Pick a suggestion or skip the row.</p>:null}
   <div role="tablist" aria-label="Import preview filters" className="flex flex-wrap gap-2">
    {(["ALL","MATCHED","UNUSABLE"] as const).map(tab=><Button variant="ghost" className={previewTab===tab?"border-b-2 border-[var(--lms-primary)]":""} key={tab} type="button" role="tab"
     aria-selected={previewTab===tab} onClick={()=>{setPreviewTab(tab);setPreviewPage(1);}}
     >
     {tab==="ALL"?"All":tab==="MATCHED"?"Matched":"Can't use"}</Button>)}
   </div>
   <ul className="space-y-1 text-xs">{preview.preview.map((row,i)=>({row,i}))
    .filter(({row})=>previewTab==="ALL"||row.status===(previewTab==="MATCHED"?"matched":"unusable"))
    .slice((previewPage-1)*8,previewPage*8)
    .map(({row,i})=><li className="min-w-0 break-all rounded-[var(--lms-control-radius)] border border-border p-2" key={i}>
    {row.status==="unusable"?<Button variant="secondary" type="button" disabled={busy||skippedByUser.includes(i)}
     onClick={()=>setSkippedByUser(current=>current.includes(i)?current:[...current,i])}
     className="mr-2 min-h-9 rounded-[var(--lms-control-radius)] border border-border px-2 text-link">
     {skippedByUser.includes(i)?"Row skipped":"Skip row"}</Button>:
     <label className="mr-2 inline-flex items-center gap-1"><Checkbox checked={!skippedByUser.includes(i)} onChange={event=>setSkippedByUser(current=>event.target.checked?current.filter(x=>x!==i):[...current,i])} disabled={busy}/>Include</label>}
    <strong>Row {i+1}: {row.studentName??preview.rows[i]?.studentCode}</strong>
    <p>Roll: {row.rollNumber??preview.rows[i]?.studentCode} · Current: {row.currentStatus??"—"} · Becomes: {row.proposedStatus??"—"}</p>
    <p>{row.status==="matched"&&row.currentStatus===row.proposedStatus?
      "No change":row.status==="matched"?"Matched":"Can't use"}{row.reason?" — "+row.reason:""}</p>
   </li>)}</ul>
   <nav aria-label="Import preview pages" className="flex flex-wrap items-center gap-3 text-xs">
    <Button variant="secondary" type="button" disabled={busy||previewPage===1} onClick={()=>setPreviewPage(p=>Math.max(1,p-1))} >Previous</Button>
    <span>Page {previewPage} of {Math.max(1,Math.ceil(preview.preview.filter(row=>previewTab==="ALL"||row.status===(previewTab==="MATCHED"?"matched":"unusable")).length/8))}</span>
    <Button variant="secondary" type="button" disabled={busy||previewPage*8>=preview.preview.filter(row=>previewTab==="ALL"||row.status===(previewTab==="MATCHED"?"matched":"unusable")).length} onClick={()=>setPreviewPage(p=>p+1)} >Next</Button>
   </nav>
   <div className="flex flex-wrap gap-2">
    <Button variant="secondary" type="button" disabled={busy} onClick={()=>fileInput.current?.click()} >Choose another file</Button>
    <Button variant="secondary" type="button" disabled={busy} onClick={()=>setDiscardPending(true)} >Discard review</Button>
   </div>
   <Button variant="secondary" type="button" disabled={busy} onClick={()=>void copyPreview()} >Copy preview outcomes CSV</Button>
   <label className="flex items-start gap-2 text-sm text-body">
     <Checkbox className="mt-1 h-4 w-4 accent-primary"
       checked={acknowledged} disabled={busy}
       onChange={event=>setAcknowledged(event.target.checked)}/>
     I reviewed the matched learners and understand that applying these decisions will be audited.
     Unusable rows must be explicitly skipped before the matched decisions can be saved.
   </label>
   <Button variant="primary" type="button" disabled={busy||preview.ready===0||unresolved>0||!acknowledged} onClick={()=>void commit()}
    >Confirm matched decisions</Button>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
  {lastActionId?<TpoBatchUndoControl batchId={batchId} actionId={lastActionId}/>:null}
  </div></Drawer>
  <ConfirmDialog open={discardPending} onOpenChange={setDiscardPending}
   title="Discard import review?" description="The preview, your included or skipped row choices and review acknowledgement will be cleared. No eligibility decisions have been saved."
   confirmLabel="Discard review" onConfirm={()=>{
    setPreview(null);setSkippedByUser([]);setAcknowledged(false);setPreviewPage(1);
    setDiscardPending(false);setNotice("Review discarded. No changes were saved.");
   }}/>
 </section>;
}
