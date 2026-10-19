"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseFacultyBulkCsv } from "@/modules/people/faculty-bulk-import-model";
import {canSubmitFacultyBulkImport} from "@/modules/people/faculty-bulk-import-submit-guard";
import {facultyBulkImportResponseSchema,facultyBulkImportFailureMessage} from "@/modules/people/faculty-bulk-import-response-model";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";

type Result={row:number;name:string;status:"CREATED"|"FAILED"|"SKIPPED";message:string};
export function SuperAdminFacultyBulkImport({collegeId}:{collegeId:string}){
 const router=useRouter();
 const fileVersion=useRef(0);
 const loadedCsv=useRef<{version:number;text:string}|null>(null);
 const submissionInProgress=useRef(false);
 const {askConfirm,dialog}=useConfirmFlow();
 const [csv,setCsv]=useState("");
 const [filename,setFilename]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [results,setResults]=useState<Result[]>([]);
 let count=0,issue="";
 try{if(csv.trim())count=parseFacultyBulkCsv(csv).length;}
 catch(cause){issue=cause instanceof Error?cause.message:"Invalid faculty file";}
 async function fileSelected(file:File|null){
  const version=++fileVersion.current;
  loadedCsv.current=null;
  // Never let a rejected or slow replacement upload reuse the previously
  // validated CSV while displaying the new filename.
  setCsv("");setResults([]);setError("");setFilename(file?.name??"");
  if(!file)return;
  if(!file.name.toLowerCase().endsWith(".csv")){setError("Choose a .csv faculty file.");return;}
  if(file.size>1_500_000){setError("The CSV file exceeds 1.5 MB.");return;}
  try{
   const text=await file.text();
   if(version===fileVersion.current){
    loadedCsv.current={version,text};
    setCsv(text);
   }
  }catch{
   if(version===fileVersion.current)setError("Could not read the CSV file.");
  }
 }
 async function submit(){
  if(submissionInProgress.current)return;
  const loaded=loadedCsv.current;
  const version=loaded?.version??-1;
  const inputCsv=loaded?.text??"";
  const allowed=()=>canSubmitFacultyBulkImport({
   busy,count,issue,error,filename,snapshotVersion:version,
   currentVersion:fileVersion.current,csvMatchesLoaded:Boolean(loaded)&&inputCsv===csv,
  });
  if(!allowed())return;
  // React state updates do not synchronously disable the button. Reserve
  // the action through confirmation and the network call to reject double
  // clicks, while allowing cancel or a different file to release the guard.
  submissionInProgress.current=true;
  try{
   if(!(await askConfirm("Onboard "+count+" faculty from this file?"))||!allowed())return;
   setBusy(true);setError("");setResults([]);
   try{
    const response=await fetch("/api/admin/faculty/bulk-import",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({collegeId,csv:inputCsv,confirmed:true}),
    });
    if(!response.ok)throw new Error(facultyBulkImportFailureMessage(response.status));
    const parsed=facultyBulkImportResponseSchema.safeParse(await response.json());
    if(!parsed.success)throw new Error("The import result could not be verified. Review the faculty roster before retrying.");
    setResults(parsed.data.results);router.refresh();
   }catch(cause){setError(cause instanceof Error?cause.message:"Bulk import failed.");}
   finally{setBusy(false);}
  }finally{submissionInProgress.current=false;}
 }
 const downloadSample=()=>{
  const sample="First Name,Last Name,Mobile Number,Email\r\nAnjali,Sharma,9876543210,anjali@example.edu\r\n";
  const element=document.createElement("a");
  const url=URL.createObjectURL(new Blob([sample],{type:"text/csv"}));
  element.href=url;element.download="bulk_faculty_sample.csv";element.click();
  URL.revokeObjectURL(url);
 };
 return <section className="space-y-3 border-t border-border pt-4">
  {dialog}
  <h2 className="font-semibold">Bulk register faculty</h2>
  <p className="text-sm text-body">Import up to 500 faculty. Columns: First Name, Last Name, Mobile Number, Email (optional). Existing identities are verified by the server.</p>
  <div className="flex flex-wrap items-center gap-3">
   <Button type="button" variant="secondary" onClick={downloadSample}
    className="min-h-9">Download sample CSV</Button>
   <label className="text-sm font-semibold">Choose CSV
    <Input type="file" accept=".csv,text/csv" disabled={busy}
      onChange={event=>void fileSelected(event.target.files?.[0]??null)}
      className="mt-2 max-w-full file:mr-3 file:rounded-[var(--lms-control-radius)] file:border-0 file:bg-[var(--lms-primary-subtle)] file:px-2 file:py-1 file:text-[var(--lms-primary-text)]"/>
   </label>
  </div>
  {filename?<p className="text-xs text-muted-foreground">File: {filename}</p>:null}
  {count>0?<p role="status" className="text-sm">{count} rows validated locally; review before creating.</p>:null}
  {(issue||error)?<p role="alert" className="text-sm text-error">{error||issue}</p>:null}
  <Button type="button" onClick={()=>void submit()} disabled={busy||!count||Boolean(issue||error)||!filename}
    className="min-h-9">
    {busy?"Importing…":"Validate and Create"}
  </Button>
  {results.length>0?<div className="space-y-2">
   <p role="status" className="text-sm">{results.filter(x=>x.status==="CREATED").length} created, {results.filter(x=>x.status==="FAILED").length} failed, {results.filter(x=>x.status==="SKIPPED").length} skipped.</p>
   <div className="max-h-80 overflow-auto">
    <DataTable<Result> caption="Faculty bulk import results"
     rows={results} getRowKey={row=>String(row.row)}
     empty={<p>No faculty import results yet.</p>}
     columns={[
      {key:"row",header:"Row",mobilePriority:"primary",cell:row=>row.row},
      {key:"name",header:"Name",mobilePriority:"secondary",cell:row=>row.name},
      {key:"result",header:"Result",mobilePriority:"secondary",cell:row=>row.status},
      {key:"reason",header:"Reason",mobilePriority:"secondary",cell:row=>row.message},
     ]}/>
   </div>
  </div>:null}
 </section>;
}
