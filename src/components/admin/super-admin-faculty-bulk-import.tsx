"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseFacultyBulkCsv } from "@/modules/people/faculty-bulk-import-model";

type Result={row:number;name:string;status:"CREATED"|"FAILED"|"SKIPPED";message:string};
export function SuperAdminFacultyBulkImport({collegeId}:{collegeId:string}){
 const router=useRouter();
 const [csv,setCsv]=useState("");
 const [filename,setFilename]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [results,setResults]=useState<Result[]>([]);
 let count=0,issue="";
 try{if(csv.trim())count=parseFacultyBulkCsv(csv).length;}
 catch(cause){issue=cause instanceof Error?cause.message:"Invalid faculty file";}
 async function fileSelected(file:File|null){
  if(!file)return;
  setResults([]);setError("");setFilename(file.name);
  if(!file.name.toLowerCase().endsWith(".csv")){setError("Choose a .csv faculty file.");return;}
  if(file.size>1_500_000){setError("The CSV file exceeds 1.5 MB.");return;}
  try{setCsv(await file.text());}catch{setError("Could not read the CSV file.");}
 }
 async function submit(){
  if(busy||!count||issue||!window.confirm("Onboard "+count+" faculty from this file?"))return;
  setBusy(true);setError("");setResults([]);
  try{
   const response=await fetch("/api/admin/faculty/bulk-import",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({collegeId,csv,confirmed:true}),
   });
   const result=await response.json() as {results?:Result[];error?:string};
   if(!response.ok)throw new Error(result.error??"Bulk onboarding failed");
   setResults(result.results??[]);router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Bulk import failed.");}
  finally{setBusy(false);}
 }
 const downloadSample=()=>{
  const sample="First Name,Last Name,Mobile Number,Email\r\nAnjali,Sharma,9876543210,anjali@example.edu\r\n";
  const element=document.createElement("a");
  const url=URL.createObjectURL(new Blob([sample],{type:"text/csv"}));
  element.href=url;element.download="bulk_faculty_sample.csv";element.click();
  URL.revokeObjectURL(url);
 };
 return <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold">Bulk register faculty</h2>
  <p className="text-sm text-body">Import up to 500 faculty. Columns: First Name, Last Name, Mobile Number, Email (optional). Existing identities are verified by the server.</p>
  <div className="flex flex-wrap items-center gap-3">
   <button type="button" onClick={downloadSample}
    className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text">Download sample CSV</button>
   <label className="text-sm font-semibold">Choose CSV
    <input type="file" accept=".csv,text/csv" disabled={busy}
      onChange={event=>void fileSelected(event.target.files?.[0]??null)}
      className="ml-2 max-w-full text-sm"/>
   </label>
  </div>
  {filename?<p className="text-xs text-muted-foreground">File: {filename}</p>:null}
  {count>0?<p role="status" className="text-sm">{count} rows validated locally; review before creating.</p>:null}
  {(issue||error)?<p role="alert" className="text-sm text-error">{error||issue}</p>:null}
  <button type="button" onClick={()=>void submit()} disabled={busy||!count||Boolean(issue)}
    className="min-h-10 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
    {busy?"Importing…":"Validate and Create"}
  </button>
  {results.length>0?<div className="space-y-2">
   <p role="status" className="text-sm">{results.filter(x=>x.status==="CREATED").length} created, {results.filter(x=>x.status==="FAILED").length} failed, {results.filter(x=>x.status==="SKIPPED").length} skipped.</p>
   <div className="max-h-80 overflow-auto"><table className="min-w-full text-left text-sm">
    <thead><tr><th className="p-2">Row</th><th className="p-2">Name</th><th className="p-2">Result</th><th className="p-2">Reason</th></tr></thead>
    <tbody>{results.map(row=><tr key={row.row} className="border-t border-border">
     <td className="p-2">{row.row}</td><td className="p-2">{row.name}</td>
     <td className="p-2">{row.status}</td><td className="p-2">{row.message}</td>
    </tr>)}</tbody>
   </table></div>
  </div>:null}
 </section>;
}
