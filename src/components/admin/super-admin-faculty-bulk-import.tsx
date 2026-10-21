"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseFacultyBulkCsv } from "@/modules/people/faculty-bulk-import-model";
import {canSubmitFacultyBulkImport} from "@/modules/people/faculty-bulk-import-submit-guard";
import {facultyBulkImportResponseSchema,facultyBulkImportFailureMessage} from "@/modules/people/faculty-bulk-import-response-model";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FileUpload } from "@/components/ui/file-upload";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/select";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";

type Result={row:number;name:string;status:"CREATED"|"FAILED"|"SKIPPED"|"PARTIAL";message:string};
export function SuperAdminFacultyBulkImport({collegeId,departments=[]}:{
 collegeId:string;departments?:readonly {id:string;name:string}[];
}){
 const router=useRouter();
 const fileVersion=useRef(0);
 const loadedCsv=useRef<{version:number;text:string}|null>(null);
 const submissionInProgress=useRef(false);
 const {askConfirm,dialog}=useConfirmFlow();
 const [csv,setCsv]=useState("");
 const [filename,setFilename]=useState("");
 const [departmentId,setDepartmentId]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [results,setResults]=useState<Result[]>([]);
 const [previewVersion,setPreviewVersion]=useState(-1);
 let parsedRows:ReturnType<typeof parseFacultyBulkCsv> = [],issue="";
 try{if(csv.trim())parsedRows=parseFacultyBulkCsv(csv);}
 catch(cause){issue=cause instanceof Error?cause.message:"Invalid faculty file";}
 const count=parsedRows.length;
 const rowIssues:string[]=[];
 const mobileRows=new Map<string,number>(),emailRows=new Map<string,number>();
 parsedRows.forEach((row,index)=>{
   const rowNumber=index+1;
   const earlierMobile=mobileRows.get(row.phoneE164);
   if(earlierMobile!==undefined)rowIssues.push("Record "+rowNumber+": Duplicate mobile in file (record "+earlierMobile+").");
   else mobileRows.set(row.phoneE164,rowNumber);
   if(row.email){
     const normalized=row.email.trim().toLowerCase();
     const earlierEmail=emailRows.get(normalized);
     if(earlierEmail!==undefined)rowIssues.push("Record "+rowNumber+": Duplicate email in file (record "+earlierEmail+").");
     else emailRows.set(normalized,rowNumber);
   }
 });
 async function fileSelected(file:File|null){
  const version=++fileVersion.current;
  loadedCsv.current=null;
  // Never let a rejected or slow replacement upload reuse the previously
  // validated CSV while displaying the new filename.
  setCsv("");setResults([]);setError("");setPreviewVersion(-1);setFilename(file?.name??"");
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
  if(!allowed()||previewVersion!==version||rowIssues.length>0||!departmentId||
     !departments.some(item=>item.id===departmentId))return;
  // React state updates do not synchronously disable the button. Reserve
  // the action through confirmation and the network call to reject double
  // clicks, while allowing cancel or a different file to release the guard.
  submissionInProgress.current=true;
  try{
   if(!(await askConfirm("Create "+count+" faculty from this locally previewed file? The server will check identities as it creates them. Some rows may fail; there is no server-only validation preview."))||
      !allowed()||previewVersion!==version||rowIssues.length>0||
      !departments.some(item=>item.id===departmentId))return;
   setBusy(true);setError("");setResults([]);
   try{
    const response=await fetch("/api/admin/faculty/bulk-import",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({collegeId,departmentId,csv:inputCsv,confirmed:true}),
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
  const sample="First Name,Last Name,Mobile Number,Email,Faculty Type\r\nJohn,Doe,9876543210,john@example.com,LECTURER\r\nJane,Smith,9876543211,,MENTOR\r\n";
  const element=document.createElement("a");
  const url=URL.createObjectURL(new Blob([sample],{type:"text/csv"}));
  element.href=url;element.download="bulk_faculty_sample.csv";
  document.body.appendChild(element);
  try { element.click(); }
  finally { element.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000); }
 };
 return <section className="min-w-0 space-y-3 pb-2">
  {dialog}
  <h3 className="font-semibold text-foreground">Bulk register faculty</h3>
  <p className="text-sm text-body">
    Import up to 500 faculty. Columns: First Name, Last Name, Mobile Number, Email (optional), Faculty Type (LECTURER or MENTOR).
    All imported faculty are assigned to the selected college department.
    Local preview does not check existing college accounts. The server validates each identity during creation; partial imports are possible.
  </p>
  <label className="grid max-w-lg min-w-0 gap-1 text-sm font-semibold text-[var(--lms-neutral-400)]">
    Department for imported faculty
    <Select value={departmentId} onChange={event=>{
      setDepartmentId(event.target.value);setPreviewVersion(-1);setResults([]);
    }} disabled={busy||departments.length===0} required className="min-h-11 w-full md:min-h-9">
      <option value="">Choose department</option>
      {departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
    </Select>
  </label>
  {!departments.length?<Alert tone="warning">No active college departments are available.
    Set up or refresh departments before bulk faculty registration.</Alert>:null}
  <div className="flex min-w-0 flex-col items-stretch gap-3 print:hidden sm:flex-row sm:flex-wrap sm:items-center">
   <Button type="button" variant="secondary" className="min-h-11 w-full justify-center sm:w-auto md:min-h-9 print:hidden" onClick={downloadSample}>Download sample CSV</Button>
   <FileUpload label="Choose CSV" accept=".csv,text/csv" maxBytes={1_500_000} disabled={busy}
     className="print:hidden [&_input]:min-h-11 md:[&_input]:min-h-9"
     onFiles={files=>void fileSelected(files?.[0]??null)}/>
  </div>
  {filename?<p className="text-xs text-muted-foreground print:hidden">File: {filename} · {busy?"Importing":previewVersion===fileVersion.current?"Locally validated":"Needs validation"}</p>:null}
  {count>0?<p role="status" className="text-sm text-body">
    Parsed {count} row(s). Choose an active department, then Validate or Create.
  </p>:null}
  {(issue||error)?<Alert tone="error">{error||issue}</Alert>:null}
  {rowIssues.length>0?<Alert tone="error">
    <p>Resolve duplicate rows before creating faculty accounts:</p>
    <ul className="list-disc pl-5">{rowIssues.slice(0,25).map((problem,index)=><li key={index}>{problem}</li>)}</ul>
    {rowIssues.length>25?<p>{rowIssues.length-25} additional issues remain.</p>:null}
  </Alert>:null}
  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
    <Button type="button" variant="secondary" className="min-h-11 w-full justify-center sm:w-auto md:min-h-9"
      disabled={busy||!count||Boolean(issue||error)||rowIssues.length>0||!filename||
        !departments.some(item=>item.id===departmentId)}
      onClick={()=>{setError("");setPreviewVersion(fileVersion.current);}}>Validate</Button>
    <Button type="button" className="min-h-11 w-full justify-center sm:w-auto md:min-h-9 print:hidden"
      loading={busy} onClick={()=>void submit()}
      disabled={busy||!count||Boolean(issue||error)||rowIssues.length>0||!filename||
        !departments.some(item=>item.id===departmentId)||previewVersion!==fileVersion.current}>
      {busy?"Importing…":"Create"}
    </Button>
  </div>
  {previewVersion===fileVersion.current&&count>0&&rowIssues.length===0?
   <div className="max-h-60 min-w-0 overflow-auto rounded-md border border-border" role="region" aria-label="Faculty CSV row preview" tabIndex={0}>
    <table className="w-full min-w-[540px] border-collapse text-left text-xs">
     <thead><tr className="border-b border-border bg-surface-subtle">
      <th scope="col" className="px-3 py-2">First Name</th>
      <th scope="col" className="px-3 py-2">Last Name</th>
      <th scope="col" className="px-3 py-2">Mobile Number</th>
      <th scope="col" className="px-3 py-2">Email</th>
      <th scope="col" className="px-3 py-2">Faculty Type</th>
     </tr></thead>
     <tbody>{parsedRows.slice(0,10).map((row,index)=><tr key={index} className="border-b border-border">
      <td className="px-3 py-2">{row.firstName}</td>
      <td className="px-3 py-2">{row.lastName}</td>
      <td className="px-3 py-2">{row.phoneE164}</td>
      <td className="px-3 py-2">{row.email??"—"}</td>
      <td className="px-3 py-2">{row.facultyType}</td>
     </tr>)}</tbody>
    </table>
    {count>10?<p className="px-3 py-2 text-xs text-muted-foreground">Showing first 10 of {count} rows.</p>:null}
   </div>:null}
  {previewVersion===fileVersion.current&&count>0&&rowIssues.length===0?(
    <Alert tone="warning" role="status">
      Validated {count} row(s) locally for {departments.find(item=>item.id===departmentId)?.name??"the selected department"}.
      Existing identities and department ownership are rechecked by the server on Create.
      Create faculty will begin irreversible onboarding after confirmation.
    </Alert>
  ):null}
  {results.length>0?<div className="space-y-2">
   <p role="status" className="text-sm text-body">{results.filter(x=>x.status==="CREATED").length} created, {results.filter(x=>x.status==="FAILED").length} failed, {results.filter(x=>x.status==="SKIPPED").length} skipped, {results.filter(x=>x.status==="PARTIAL").length} need profile repair.</p>
   <div className="max-h-80 overflow-auto print:max-h-none print:overflow-visible">
    <DataTable<Result> caption="Faculty bulk import results"
     rows={results} getRowKey={row=>String(row.row)}
     empty={<p>No faculty import results yet.</p>}
     columns={[
      {key:"row",header:"Row",mobilePriority:"primary",cell:row=>row.row},
      {key:"name",header:"Name",mobilePriority:"secondary",cell:row=>row.name},
      {key:"result",header:"Result",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.status==="CREATED"?"success":row.status==="FAILED"||row.status==="PARTIAL"?"error":"neutral"}>{row.status}</StatusBadge>},
      {key:"reason",header:"Reason",mobilePriority:"secondary",cell:row=>row.message},
     ]}/>
   </div>
  </div>:null}
 </section>;
}
