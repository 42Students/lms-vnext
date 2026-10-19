"use client";
import { Button } from "@/components/ui/button";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {prepareSelectionImport,type SelectionImportCandidate,type SelectionImportEntry} from "@/modules/placements/tpo-selection-import-model";

export function TpoSelectionImport({jobId,candidates}:{jobId:string;candidates:SelectionImportCandidate[]}){
 const router=useRouter();const [entries,setEntries]=useState<SelectionImportEntry[]>([]);
 const [unmatched,setUnmatched]=useState<Array<{line:number;value:string;reason:string}>>([]);
 const [error,setError]=useState("");const [busy,setBusy]=useState(false);const [done,setDone]=useState("");
 const [confirmOpen,setConfirmOpen]=useState(false);
 async function read(file:File|null){
  setEntries([]);setUnmatched([]);setError("");setDone("");
  if(!file)return;
  if(!file.name.toLowerCase().endsWith(".csv")||file.size>2_000_000){
   setError("Choose a CSV file under 2 MB. Excel files should be saved as CSV first.");return;
  }
  try{
   const prepared=prepareSelectionImport(await file.text(),candidates,"");
   setEntries(prepared.accepted);setUnmatched(prepared.unmatched);
   if(!prepared.accepted.length)setError("No rows can be recorded. Check the unmatched list below.");
  }catch(e){setError(e instanceof Error?e.message:"Could not read file");}
 }
 async function confirm(){
  if(busy||!entries.length)return;

  setBusy(true);setError("");setDone("");
  try{
   let count=0;
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
   setEntries([]);router.refresh();
  }catch(e){setError((e instanceof Error?e.message:"Import failed")+
   ". Already recorded rows remain saved. Refresh before retrying.");}finally{setBusy(false);setConfirmOpen(false);}
 }
 return <section className="space-y-4 border-b border-border pb-6">
  <h2 className="font-semibold text-foreground">Import the company&apos;s selection list</h2>
  <p className="text-sm text-body">Use CSV with Application ID, Email or Student name. Optional Role and Package LPA columns.
   Rows are matched to this drive&apos;s eligible applicants. Unmatched and duplicate entries are never recorded.</p>
  <label className="block text-sm font-semibold">Selection list (CSV)
   <input type="file" accept=".csv,text/csv" disabled={busy} onChange={e=>void read(e.target.files?.[0]??null)}
    className="mt-2 block min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm md:min-h-9"/>
  </label>
  {entries.length?<div className="space-y-2">
   <p role="status" className="text-sm">{entries.length} matched · {unmatched.length} unmatched</p>
   <div tabIndex={0} role="group" aria-label="Selection import preview, scroll for more" className="max-h-52 min-h-0 overflow-auto overscroll-contain rounded-[var(--lms-control-radius)] border border-border p-2 text-sm [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)]">
    {entries.map(e=><p key={e.applicationId} className="min-h-9 border-b border-border px-2 py-2 last:border-b-0">{e.name} · {e.roleTitle}
     {e.annualCtcInr==null?"":" · ₹"+(e.annualCtcInr/100000)+" LPA"}</p>)}
   </div>
   <Button variant="primary" type="button" disabled={busy} onClick={()=>setConfirmOpen(true)}
    className="min-h-11 md:min-h-9 px-4">
    {busy?"Recording…":"Confirm and record "+entries.length+" selections"}
   </Button>
  </div>:null}
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} pending={busy}
    title={"Record "+entries.length+" matched company selections?"}
    description={unmatched.length+" unmatched rows will not be recorded. No offers will be released yet."}
    confirmLabel={"Confirm and record "+entries.length+" selections"}
    onConfirm={()=>void confirm()}/>
  {unmatched.length?<details className="rounded-[var(--lms-control-radius)] border border-border p-3" open>
   <summary className="cursor-pointer text-sm font-semibold">{unmatched.length} unmatched or unusable rows</summary>
   <ul tabIndex={0} aria-label="Unmatched selection import rows, scroll for more" className="mt-2 max-h-40 min-h-0 list-disc overflow-y-auto overscroll-contain pl-6 text-sm [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)]">{unmatched.map(x=>
    <li key={x.line}>Row {x.line}: {x.value||"Empty identifier"} — {x.reason}</li>)}</ul>
  </details>:null}
  {error?<p role="alert" className="text-sm text-foreground">{error}</p>:null}
  {done?<p role="status" className="text-sm text-body">{done}</p>:null}
 </section>;
}
