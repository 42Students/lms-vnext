"use client";
import { Disclosure } from "@/components/ui/disclosure";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { DataTable } from "@/components/ui/data-table";
import {InlineNotice} from "@/components/ui/inline-notice";
import {EmptyState} from "@/components/ui/empty-state";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {prepareSelectionImport,type SelectionImportCandidate,type SelectionImportEntry} from "@/modules/placements/tpo-selection-import-model";
import { Heading } from "@/components/ui/heading";

export function TpoSelectionImport({jobId,candidates}:{jobId:string;candidates:SelectionImportCandidate[]}){
 const router=useRouter();const [entries,setEntries]=useState<SelectionImportEntry[]>([]);
 const [unmatched,setUnmatched]=useState<Array<{line:number;value:string;reason:string}>>([]);
 const [error,setError]=useState("");const [busy,setBusy]=useState(false);const importRef=useRef(false);const [done,setDone]=useState("");
 const [reading,setReading]=useState(false);
 const fileRevision=useRef(0);
 const [needsRefresh,setNeedsRefresh]=useState(false);
 const [confirmOpen,setConfirmOpen]=useState(false);
 async function read(file:File|null){
  if(busy||needsRefresh)return;
  const revision=++fileRevision.current;
  setEntries([]);setUnmatched([]);setError("");setDone("");
  if(!file){setReading(false);return;}
  if(!file.name.toLowerCase().endsWith(".csv")||file.size>2_000_000){
   setReading(false);setError("Choose a CSV file under 2 MB. Excel files should be saved as CSV first.");return;
  }
  setReading(true);
  try{
   const prepared=prepareSelectionImport(await file.text(),candidates,"");
   if(revision!==fileRevision.current)return;
   setEntries(prepared.accepted);setUnmatched(prepared.unmatched);
   if(!prepared.accepted.length)setError("No rows can be recorded. Check the unmatched list below.");
  }catch(e){if(revision===fileRevision.current)setError(e instanceof Error?e.message:"Could not read file");}
  finally{if(revision===fileRevision.current)setReading(false);}
 }
 async function confirm(){
  if(busy||reading||needsRefresh||importRef.current||!entries.length)return;
  importRef.current=true;

  setBusy(true);setError("");setDone("");
  let count=0;
  try{
   for(let i=0;i<entries.length;i+=100){
    const chunk=entries.slice(i,i+100);
    const response=await fetch("/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/selections",{
     method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
     body:JSON.stringify({action:"RECORD",entries:chunk.map(e=>({
      applicationId:e.applicationId,roleTitle:e.roleTitle,annualCtcInr:e.annualCtcInr,
     }))}),
    });
    if(!response.ok){
     throw Error("Import batch failed. Refresh before retrying.");
    }
    count+=chunk.length;
   }
   setDone(count+" selection(s) recorded. Students have not been notified; verify and release from the selection register.");
   setEntries([]);setNeedsRefresh(true);router.refresh();
  }catch(e){
   setNeedsRefresh(true);
   setError((e instanceof Error?e.message:"Import failed")+
    ". "+count+" row(s) confirmed before the error. Reload the register before retrying; already recorded rows may remain saved.");
  }finally{importRef.current=false;setBusy(false);setConfirmOpen(false);}
 }
 return <section aria-labelledby="tpo-selection-import-title" className="min-w-0 space-y-3 border-b border-border pb-4">
  <Heading level={2} size="base" id="tpo-selection-import-title" className="text-[var(--lms-heading)] leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px]">Import the company&apos;s selection list</Heading>
  <p className="text-sm text-body leading-[22px]">Use CSV with Application ID, Email or Student name. Optional Role and Package LPA columns.
   Rows are matched to this drive&apos;s eligible applicants. Unmatched and duplicate entries are never recorded.</p>
  <FileUpload className="print:hidden [&_input]:min-h-11 md:[&_input]:min-h-9" label="Selection list (CSV)" accept=".csv,text/csv" maxBytes={2_000_000}
     disabled={busy||reading||needsRefresh} onFiles={files=>void read(files?.[0]??null)}/>
  {reading?<p role="status" className="text-sm text-body leading-[22px]">Reading selection CSV…</p>:null}
  {entries.length?<div className="space-y-2">
   <p role="status" className="text-sm leading-[22px]">{entries.length} matched · {unmatched.length} unmatched</p>
   <div className="max-h-80 min-w-0 overflow-auto border-y border-border print:max-h-none print:overflow-visible">
    <DataTable<SelectionImportEntry> caption="Selection import preview" rows={entries}
     getRowKey={item=>item.applicationId} empty={<EmptyState title="No matched selections yet."/>}
     columns={[
      {key:"student",header:"Student",cell:item=>item.name,mobilePriority:"primary"},
      {key:"role",header:"Role",cell:item=>item.roleTitle,mobilePriority:"secondary"},
      {key:"package",header:"Package",cell:item=>item.annualCtcInr==null?"—":"₹"+item.annualCtcInr/100000+" LPA",mobilePriority:"secondary"},
     ]}/>
   </div>
   <Button variant="primary" type="button" disabled={busy||reading||needsRefresh} onClick={()=>setConfirmOpen(true)}
    className="min-h-11 w-full px-4 sm:w-auto md:min-h-9 print:hidden">
    {busy?"Recording…":"Confirm and record "+entries.length+" selections"}
   </Button>
  </div>:null}
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} pending={busy}
    title={"Record "+entries.length+" matched company selections?"}
    description={unmatched.length+" unmatched rows will not be recorded. No offers will be released yet."}
    confirmVariant="primary"
    confirmLabel={"Confirm and record "+entries.length+" selections"}
    onConfirm={()=>void confirm()}/>
  {unmatched.length?<Disclosure title={`${unmatched.length} unmatched or unusable rows`} className="border-t border-border pt-3" defaultOpen={entries.length===0}>
   <div role="region" aria-label="Unmatched selection import rows" tabIndex={0} className="mt-2 max-h-64 min-w-0 overflow-auto border-y border-border print:max-h-none print:overflow-visible"><DataTable caption="Unmatched selection import rows" rows={unmatched} getRowKey={row=>String(row.line)} empty={<EmptyState title="No unmatched rows."/>} columns={[{key:"line",header:"Row",mobilePriority:"primary",cell:row=>row.line},{key:"identity",header:"Identifier",mobilePriority:"secondary",cell:row=>row.value||"Empty identifier"},{key:"reason",header:"Reason",mobilePriority:"secondary",cell:row=>row.reason}]}/></div>
  </Disclosure>:null}
  {error?<InlineNotice tone="error" message={error}/>:null}
  {needsRefresh?<div role="alert" className="space-y-2 rounded-[var(--lms-control-radius)] border border-warning bg-warning-subtle p-3 text-sm">
   <p>{error?"The import outcome must be reconciled before another submission to avoid duplicate selections.":"Reload the selection register before importing again to see the latest recorded learners."}</p>
   <Button variant="secondary" type="button" onClick={()=>window.location.reload()} className="min-h-11">Reload selection register</Button>
  </div>:null}
  {done?<InlineNotice tone="success" message={done}/>:null}
 </section>;
}
