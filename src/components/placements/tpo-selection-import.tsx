"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {prepareSelectionImport,type SelectionImportCandidate,type SelectionImportEntry} from "@/modules/placements/tpo-selection-import-model";

export function TpoSelectionImport({jobId,candidates}:{jobId:string;candidates:SelectionImportCandidate[]}){
 const router=useRouter();const [entries,setEntries]=useState<SelectionImportEntry[]>([]);
 const [unmatched,setUnmatched]=useState<Array<{line:number;value:string;reason:string}>>([]);
 const [error,setError]=useState("");const [busy,setBusy]=useState(false);const [done,setDone]=useState("");
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
  if(!window.confirm("Record "+entries.length+" matched company selections? "+unmatched.length+" unmatched rows will not be recorded. No offers will be released yet."))return;
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
     const body=await response.json().catch(()=>null) as {error?:string;issues?:Array<{message:string}>}|null;
     throw Error(body?.issues?.[0]?.message??body?.error??"Import batch failed");
    }
    count+=chunk.length;
   }
   setDone(count+" selection(s) recorded. Students have not been notified; verify and release from the selection register.");
   setEntries([]);router.refresh();
  }catch(e){setError((e instanceof Error?e.message:"Import failed")+
   ". Already recorded rows remain saved. Refresh before retrying.");}finally{setBusy(false);}
 }
 return <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <h2 className="font-semibold text-foreground">Import the company's selection list</h2>
  <p className="text-sm text-body">Use CSV with Application ID, Email or Student name. Optional Role and Package LPA columns.
   Rows are matched to this drive's eligible applicants. Unmatched and duplicate entries are never recorded.</p>
  <label className="block text-sm font-semibold">Selection list (CSV)
   <input type="file" accept=".csv,text/csv" disabled={busy} onChange={e=>void read(e.target.files?.[0]??null)}
    className="mt-2 block w-full rounded border border-border p-3 text-sm"/>
  </label>
  {entries.length?<div className="space-y-2">
   <p role="status" className="text-sm">{entries.length} matched · {unmatched.length} unmatched</p>
   <div className="max-h-52 overflow-auto rounded border border-border p-2 text-sm">
    {entries.map(e=><p key={e.applicationId} className="border-b border-border px-2 py-1">{e.name} · {e.roleTitle}
     {e.annualCtcInr==null?"":" · ₹"+(e.annualCtcInr/100000)+" LPA"}</p>)}
   </div>
   <button type="button" disabled={busy} onClick={()=>void confirm()}
    className="min-h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
    {busy?"Recording…":"Confirm and record "+entries.length+" selections"}
   </button>
  </div>:null}
  {unmatched.length?<details className="rounded border border-border p-3" open>
   <summary className="cursor-pointer text-sm font-semibold">{unmatched.length} unmatched or unusable rows</summary>
   <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-6 text-sm">{unmatched.map(x=>
    <li key={x.line}>Row {x.line}: {x.value||"Empty identifier"} — {x.reason}</li>)}</ul>
  </details>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {done?<p role="status" className="text-sm text-body">{done}</p>:null}
 </section>;
}
