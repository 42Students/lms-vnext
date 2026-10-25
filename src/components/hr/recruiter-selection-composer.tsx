"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {apiFetch} from "@/lib/api-fetch";
import {recruiterSelectionRangeWarning} from "@/modules/placements/recruiter-selection-list-model";
import {parseRecruiterSelectionCsv,recruiterSelectionCsvTemplate}
 from "@/modules/placements/recruiter-selection-csv-model";

type Candidate={id:string;name:string};
type Kind="OFFER"|"LETTER_OF_INTENT";

/** A recruiter proposes a list; it cannot release an offer to a learner. */
export function RecruiterSelectionComposer({jobId,collegeId,candidates,minCtcInr,maxCtcInr,disabled=false}:{
 jobId:string;collegeId:string;candidates:readonly Candidate[];
 minCtcInr:number|null;maxCtcInr:number|null;disabled?:boolean;
}){
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [selected,setSelected]=useState<string[]>([]);
 const [kind,setKind]=useState<Kind>("OFFER");
 const [ctcLpa,setCtcLpa]=useState("");
 const [packageDescription,setPackageDescription]=useState("");
 const [confirming,setConfirming]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const [csvError,setCsvError]=useState("");
 const [csvStatus,setCsvStatus]=useState("");
 const [importing,setImporting]=useState(false);
 const importPending=useRef(false);
 const nonce=useRef<string|null>(null);
 const fileInput=useRef<HTMLInputElement>(null);
 const pending=useRef(false);
 const eligible=new Set(candidates.map(candidate=>candidate.id));
 const chosen=selected.filter(id=>eligible.has(id));
 const warning=recruiterSelectionRangeWarning(ctcLpa,minCtcInr,maxCtcInr);
 const validCtc=/^(?:|\d{1,3}(?:\.\d{1,2})?)$/.test(ctcLpa)&&
  (!ctcLpa||Number(ctcLpa)>0);
 const canSend=!disabled&&!busy&&chosen.length>0&&validCtc&&
  packageDescription.trim().length<=500;

 async function importList(file:File|undefined){
  if(!file||pending.current||importPending.current)return;
  setCsvError("");setCsvStatus("");
  const name=file.name.toLowerCase();
  const xlsx=name.endsWith(".xlsx");
  if((xlsx&&file.size>256000)||(!xlsx&&(file.size>65536||!name.endsWith(".csv")))){
   setCsvError("Use a .csv file under 64 KB or an .xlsx workbook under 250 KB.");
   return;
  }
  importPending.current=true;setImporting(true);
  try{
   let csv:string;
   if(xlsx){
    const form=new FormData();
    form.set("file",file);
    const response=await fetch("/api/placements/recruiter/selection-xlsx/parse",{
     method:"POST",credentials:"same-origin",body:form,
    });
    const payload:unknown=await response.json().catch(()=>null);
    if(!response.ok){
     const error=payload&&typeof payload==="object"&&!Array.isArray(payload)
      ?(payload as {error?:unknown}).error:null;
     setCsvError(response.status===403?"Sign in with an authorized recruiter account to import a workbook.":
      response.status===413?"Workbook is too large.":
      typeof error==="string"&&error.length<180&&!/[<>]/.test(error)?error:
      "Could not read the Excel workbook. Save it as CSV and retry.");
     return;
    }
    if(!payload||typeof payload!=="object"||Array.isArray(payload)||
       (payload as {ok?:unknown}).ok!==true||
       typeof (payload as {csv?:unknown}).csv!=="string"){
     setCsvError("The workbook parser returned an invalid result.");
     return;
    }
    csv=(payload as {csv:string}).csv;
    if(csv.length>65536){
     setCsvError("Workbook contains too many applicant IDs.");
     return;
    }
   }else csv=await file.text();
   // An Excel file is never proof of authorization: all IDs must be in the
   // exact eligible set that the recruiter received from the protected job.
   const allowed=new Set(candidates.map(candidate=>candidate.id.toLowerCase()));
   const result=parseRecruiterSelectionCsv(csv,allowed);
   if(!result.ok){setCsvError(result.error);return;}
   setSelected(result.ids);nonce.current=null;setError("");setSuccess("");
   setCsvStatus(result.ids.length+" eligible applicants selected from "+(xlsx?"Excel":"CSV")+
    ". Review them before sending. No offer was issued.");
   setOpen(true);
  }catch{setCsvError("Could not import this file. No changes were made.");}
  finally{importPending.current=false;setImporting(false);}
 }
 function downloadTemplate(){
  const blob=new Blob([recruiterSelectionCsvTemplate(candidates)],{type:"text/csv;charset=utf-8"});
  const href=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=href;link.download="recruiter-eligible-applicants.csv";link.click();
  window.setTimeout(()=>URL.revokeObjectURL(href),3000);
 }
 function changeSelection(id:string,checked:boolean){
  setSelected(previous=>checked?[...new Set([...previous,id])]:previous.filter(value=>value!==id));
  nonce.current=null;setError("");setSuccess("");
 }
 function startConfirmation(){
  setError("");
  if(!canSend){setError("Choose at least one eligible applicant and review the CTC.");return;}
  setConfirming(true);
 }
 async function submit(){
  if(pending.current||!canSend)return;
  pending.current=true;setBusy(true);setError("");setSuccess("");
  const submissionId=nonce.current??crypto.randomUUID();
  nonce.current=submissionId;
  try{
   const receipt=await apiFetch<{id:string;status:string;submitted:boolean}>(
    "/api/placements/recruiter/drives/"+encodeURIComponent(jobId)+"/selections",{
    method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     jobId,collegeId,submissionId,kind,ctcLpa,
     packageDescription:packageDescription.trim(),
     applicationIds:chosen,acknowledgedCtcWarning:Boolean(warning),
    }),
   });
   setConfirming(false);setSelected([]);setPackageDescription("");
   setCtcLpa("");nonce.current=null;
   setSuccess(receipt.submitted
    ?chosen.length+" sent. The placement cell verifies each before students see an offer."
    :chosen.length+" already sent. The placement cell verifies each before students see an offer.");
   setOpen(false);router.refresh();
  }catch{
   setError("Could not send the selection list. Nothing was issued. Check that the placement service is available and try again.");
   setConfirming(false);
  }finally{pending.current=false;setBusy(false);}
 }
 return <section className="space-y-3" aria-label="Selection list">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div>
    <h3 className="font-semibold text-foreground">Send selection list</h3>
    <p className="text-sm text-body">Propose an Offer or Letter of Intent to the placement cell for verification.</p>
   </div>
   <div className="flex flex-wrap gap-2">
    <Button disabled={disabled||candidates.length===0} onClick={()=>setOpen(value=>!value)}>
     <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0" fill="none">
      <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
     </svg>
     Pick from those who clear
    </Button>
    <Button variant="secondary" disabled={disabled||busy||importing||candidates.length===0}
     onClick={()=>fileInput.current?.click()}>Upload your list (Excel)</Button>
    <input ref={fileInput} type="file" hidden
     aria-label="Choose Excel or CSV selection list"
     accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
     onChange={event=>{void importList(event.target.files?.[0]);event.target.value="";}}/>
   </div>
  </div>
  {disabled?<p role="status" className="text-sm text-warning-text">This drive is closed; selection submissions are unavailable.</p>:null}
  {!disabled&&candidates.length===0?<p role="status" className="text-sm text-body">No applicants have passed every completed assessment and interview round.</p>:null}
  {success?<p role="status" className="text-sm text-success">{success}</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {csvError?<p role="alert" className="text-sm text-error">{csvError}</p>:null}
  {csvStatus?<p role="status" className="text-sm text-success">{csvStatus}</p>:null}
  {open&&!disabled?<div className="space-y-4 border-t border-border pt-4">
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="grid gap-1 text-sm font-semibold text-body">Selection kind
     <Select value={kind} onChange={event=>{setKind(event.target.value as Kind);nonce.current=null;}}>
      <option value="OFFER">Offer</option>
      <option value="LETTER_OF_INTENT">Letter of Intent</option>
     </Select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">CTC (LPA)
     <Input type="number" inputMode="decimal" min="0.01" max="999.99" step="0.01"
      value={ctcLpa} onChange={event=>{setCtcLpa(event.target.value);nonce.current=null;}}
      aria-invalid={!validCtc}/>
    </label>
   </div>
   {warning?<p role="status" className="text-sm text-warning-text">{warning}</p>:null}
   <label className="grid gap-1 text-sm font-semibold text-body">Package details (optional)
    <Textarea value={packageDescription} maxLength={500}
     onChange={event=>{setPackageDescription(event.target.value);nonce.current=null;}}
     rows={3}/>
   </label>
   <div className="space-y-2">
    <p className="text-sm font-semibold text-body">Select applicants ({chosen.length} selected)</p>
    <label className="flex min-h-11 items-center gap-2 text-sm">
     <Checkbox checked={candidates.length>0&&chosen.length===candidates.length}
      indeterminate={chosen.length>0&&chosen.length<candidates.length}
      onChange={event=>{setSelected(event.target.checked?candidates.map(item=>item.id):[]);nonce.current=null;}}/>
     Select all eligible applicants
    </label>
    <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
     {candidates.map(candidate=><label key={candidate.id}
      className="flex min-h-11 items-center gap-2 border-b border-border px-3 py-2 text-sm last:border-b-0">
      <Checkbox checked={chosen.includes(candidate.id)}
       onChange={event=>changeSelection(candidate.id,event.target.checked)}/>
      {candidate.name}
     </label>)}
    </div>
   </div>
   <section aria-label="Import applicant IDs from Excel" className="space-y-2 border-t border-border pt-3">
    <h4 className="font-semibold text-foreground">Upload your list from Excel</h4>
    <p className="text-xs text-body">
     Download eligible applicants, keep application_id unchanged, choose the rows to include,
     then upload the .xlsx workbook or Excel's CSV (UTF-8). Only eligible IDs are imported.
     The file is read without executing formulas. You must review the selected applicants before sending.
    </p>
    <div className="flex flex-wrap gap-3">
     <Button type="button" variant="secondary" onClick={downloadTemplate}>Download Excel-compatible template</Button>
     <label className="grid gap-1 text-xs font-medium text-body">Upload Excel or CSV
      <Input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy||importing}
       onChange={event=>{void importList(event.target.files?.[0]);event.target.value="";}}/>
     </label>
    </div>
   </section>
   <p className="text-xs text-muted-foreground">Selections go to your college placement cell for review. This action does not issue or release offers.</p>
   <div className="flex flex-wrap gap-2">
    <Button type="button" disabled={!canSend} onClick={startConfirmation}>Review and send</Button>
    <Button type="button" variant="secondary" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button>
   </div>
  </div>:null}
  <ConfirmDialog open={confirming} onOpenChange={setConfirming}
   title="Send selection list for verification?"
   description={"Send "+chosen.length+" applicant(s) as "+(kind==="OFFER"?"an Offer":"a Letter of Intent")+
    (ctcLpa?" at "+ctcLpa+" LPA":"")+
    " to the placement cell. This does not issue any offer."}
   confirmLabel="Send selection list" confirmVariant="primary"
   pending={busy} confirmDisabled={!canSend} onConfirm={()=>{void submit();}}>
   {warning?<p role="alert" className="text-sm font-semibold text-warning-text">{warning} You are confirming this amount.</p>:
    <p className="text-sm text-body">The placement cell must verify the selection before any offer can be released.</p>}
  </ConfirmDialog>
 </section>;
}
