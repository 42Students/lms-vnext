"use client";
import { Tabs } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {FileUpload} from "@/components/ui/file-upload";
import {DataTable} from "@/components/ui/data-table";
import {StatusBadge} from "@/components/ui/status-badge";
import {InlineNotice} from "@/components/ui/inline-notice";
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
 const filteredRows=preview?.preview.map((row,i)=>({row,i}))
  .filter(({row})=>previewTab==="ALL"||row.status===(previewTab==="MATCHED"?"matched":"unusable"))??[];
 const previewPageCount=Math.max(1,Math.ceil(filteredRows.length/8));
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
 return <section className="min-w-0 border-t border-border pt-4">
  <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
   <h2 className="m-0 font-semibold">Import eligibility</h2>
   <Button variant="secondary" type="button" className="w-full md:w-auto print:hidden"
    disabled={busy} onClick={()=>setImportOpen(true)}>Import eligibility decisions</Button>
  </div>
  <Drawer open={importOpen} onOpenChange={setImportOpen} title="Import eligibility decisions"
   dismissible={!busy}
   footer={<Button variant="primary" type="button" className="w-full md:w-auto print:hidden"
    loading={busy} disabled={busy||(preview?preview.ready===0||unresolved>0||!acknowledged:false)}
    onClick={()=>preview?void commit():void previewChanges()}>
    {preview?"Confirm matched decisions":busy?"Working…":"Preview import"}
   </Button>}>
   <div className="min-w-0 space-y-4">
   <p aria-label="Eligibility import steps" className="text-xs text-muted-foreground">Choose CSV or paste rows → Preview matched and unusable rows → Skip or resolve unmatched rows → Confirm matched decisions.</p>
  <div className="min-w-0 space-y-2">
   <FileUpload ref={fileInput} className="print:hidden [&_input]:min-h-11 md:[&_input]:min-h-9" label="Choose or drop eligibility CSV" maxBytes={1_500_000}
      accept=".csv,text/csv" disabled={busy} onFiles={files=>void chooseFile(files?.[0]??null)}/>
   {chosenName?<p className="min-w-0 break-all text-xs text-muted-foreground">Selected: {chosenName}</p>:null}
  </div>
  <details className="min-w-0 border-t border-border pt-3 print:hidden">
   <summary className="min-h-11 cursor-pointer py-3 text-[13px] font-semibold text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 md:py-2">CSV columns: studentCode,decision,reason.</summary>
   <div className="min-w-0 space-y-3 pb-2">
    <p className="text-sm text-muted-foreground">studentCode may be an exact roll number or learner membership UUID; ambiguous rolls are skipped. Names and emails are never used for matching. Up to 5000 records. Supports quoted commas, legacy column names, Yes/No and clear/reset decisions.</p>
    <p className="text-xs text-muted-foreground">For Excel files, use Save As → CSV (UTF-8) before import.</p>
    <a download="eligibility-import-template.csv" href="data:text/csv;charset=utf-8,studentCode%2Cdecision%2Creason%0A" className="lms-inline-link inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9 print:hidden focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Download a template</a>
   </div>
  </details>
  <details className="min-w-0 border-t border-border pt-3 print:hidden">
   <summary className="min-h-11 cursor-pointer py-3 text-[13px] font-semibold text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 md:py-2">CSV contents</summary>
   <label className="mt-2 block min-w-0">
    <span className="sr-only">CSV contents</span>
    <Textarea className="min-h-32 w-full min-w-0 font-mono text-xs"
     value={csv} onChange={e=>{setCsv(e.target.value);setPreview(null);setNotice("");}} disabled={busy} maxLength={1500000}/>
   </label>
  </details>
  {error&&!preview?<InlineNotice tone="error" message={error}/>:null}
  {notice&&!preview?<InlineNotice tone="success" message={notice}/>:null}
  {lastActionId?<TpoBatchUndoControl batchId={batchId} actionId={lastActionId}/>:null>
  {preview?<section className="min-w-0 space-y-4 border-t border-border pt-4">
   <p role="status" className="text-sm font-semibold">{preview.ready} matched; {preview.skipped} cannot use.</p>
   {unresolved>0?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm text-warning-text">{unresolved} row(s) need attention before you can confirm. Pick a suggestion or skip the row.</p>:null}
   <div className="min-w-0 print:hidden"><Tabs ariaLabel="Import preview filters" renderPanel={false} controlledOnly
    value={previewTab} onValueChange={next=>{setPreviewTab(next as "ALL"|"MATCHED"|"UNUSABLE");setPreviewPage(1);}}
    items={[{value:"ALL",label:"All",count:preview.preview.length},
      {value:"MATCHED",label:"Matched",count:preview.ready},
      {value:"UNUSABLE",label:"Can't use",count:preview.skipped}]} /></div>
   <DataTable<{row:Preview["preview"][number];i:number}> caption="Eligibility import preview rows"
    rows={filteredRows.slice((previewPage-1)*8,previewPage*8)}
    getRowKey={item=>String(item.i)}
    empty={<div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p role="status" className="text-sm text-body">No rows in this preview filter.</p>
      <Button variant="secondary" type="button" size="sm" className="w-full sm:w-auto"
       onClick={()=>{setPreviewTab("ALL");setPreviewPage(1);}}>All</Button>
     </div>}
    columns={[
     {key:"learner",header:"Learner",mobilePriority:"primary",cell:({row,i})=><span className="break-all">
      Row {i+1}: {row.studentName??preview.rows[i]?.studentCode}</span>},
     {key:"roll",header:"Roll",mobilePriority:"secondary",cell:({row,i})=>row.rollNumber??preview.rows[i]?.studentCode??"—"},
     {key:"change",header:"Current → Proposed",mobilePriority:"secondary",cell:({row})=>
      (row.currentStatus??"—")+" → "+(row.proposedStatus??"—")},
     {key:"result",header:"Match",mobilePriority:"secondary",cell:({row})=><>
      <StatusBadge tone={row.status==="matched"?(row.currentStatus===row.proposedStatus?"neutral":"success"):"warning"}>{row.status==="matched"&&row.currentStatus===row.proposedStatus?"No change":row.status==="matched"?"Matched":"Can't use"}</StatusBadge>
      {row.reason?<span className="ml-2 text-xs text-body">{row.reason}</span>:null}</>},
     {key:"include",header:"Include",mobilePriority:"action",cell:({row,i})=>row.status==="unusable"?
      <Button variant="secondary" size="sm" type="button" className="w-full md:w-auto print:hidden" disabled={busy||skippedByUser.includes(i)}
       onClick={()=>setSkippedByUser(current=>current.includes(i)?current:[...current,i])}>
       {skippedByUser.includes(i)?"Row skipped":"Skip row"}</Button>:
      <label className="inline-flex min-h-11 w-full items-center gap-2 text-sm md:w-auto">
       <Checkbox checked={!skippedByUser.includes(i)} disabled={busy}
        onChange={event=>setSkippedByUser(current=>event.target.checked?current.filter(x=>x!==i):[...current,i])}/>Include
      </label>},
    ]}/>
   {previewPageCount>1?<nav aria-label="Import preview pages" className="flex min-w-0 items-center justify-between gap-2 text-xs print:hidden">
    <Button variant="secondary" type="button" disabled={busy||previewPage===1}
     onClick={()=>setPreviewPage(p=>Math.max(1,p-1))}>Previous</Button>
    <span className="shrink-0 text-center tabular-nums">Page {previewPage} of {previewPageCount}</span>
    <Button variant="secondary" type="button" disabled={busy||previewPage>=previewPageCount}
     onClick={()=>setPreviewPage(p=>p+1)}>Next</Button>
   </nav>:null}
   <details className="min-w-0 border-t border-border pt-3 print:hidden">
    <summary className="min-h-11 cursor-pointer py-2 text-[13px] font-semibold text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">More actions</summary>
    <div className="flex min-w-0 flex-col gap-2 pb-2 sm:flex-row sm:flex-wrap">
     <Button variant="secondary" type="button" className="w-full sm:w-auto" disabled={busy}
      onClick={()=>void previewChanges()}>Preview import</Button>
     <Button variant="secondary" type="button" className="w-full sm:w-auto" disabled={busy}
      onClick={()=>fileInput.current?.click()}>Choose another file</Button>
     <Button variant="secondary" type="button" className="w-full sm:w-auto" disabled={busy}
      onClick={()=>setDiscardPending(true)}>Discard review</Button>
     <Button variant="secondary" type="button" className="w-full sm:w-auto" disabled={busy}
      onClick={()=>void copyPreview()}>Copy preview outcomes CSV</Button>
    </div>
   </details>
   {error?<InlineNotice tone="error" message={error}/>:null}
   {notice?<InlineNotice tone="success" message={notice}/>:null}
   <label className="flex min-h-11 min-w-0 items-start gap-2 text-sm text-body print:hidden">
     <Checkbox className="mt-1 shrink-0"
       checked={acknowledged} disabled={busy}
       onChange={event=>setAcknowledged(event.target.checked)}/>
     <span className="min-w-0">
      I reviewed the matched learners and understand that applying these decisions will be audited.
      Unusable rows must be explicitly skipped before the matched decisions can be saved.
     </span>
   </label>
  </section>:null}
  </div></Drawer>
  <ConfirmDialog open={discardPending} onOpenChange={setDiscardPending}
   title="Discard import review?" description="The preview, your included or skipped row choices and review acknowledgement will be cleared. No eligibility decisions have been saved."
   confirmLabel="Discard review" onConfirm={()=>{
    setPreview(null);setSkippedByUser([]);setAcknowledged(false);setPreviewPage(1);
    setDiscardPending(false);setNotice("Review discarded. No changes were saved.");
   }}/>
 </section>;
}
