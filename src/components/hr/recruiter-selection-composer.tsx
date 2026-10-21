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
 const nonce=useRef<string|null>(null);
 const pending=useRef(false);
 const eligible=new Set(candidates.map(candidate=>candidate.id));
 const chosen=selected.filter(id=>eligible.has(id));
 const warning=recruiterSelectionRangeWarning(ctcLpa,minCtcInr,maxCtcInr);
 const validCtc=/^(?:|\d{1,3}(?:\.\d{1,2})?)$/.test(ctcLpa)&&
  (!ctcLpa||Number(ctcLpa)>0);
 const canSend=!disabled&&!busy&&chosen.length>0&&validCtc&&
  packageDescription.trim().length<=500;
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
   await apiFetch<{id:string;status:string}>(
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
   setSuccess("Selection list sent for placement-cell verification. No offer was issued.");
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
   <Button disabled={disabled||candidates.length===0} onClick={()=>setOpen(value=>!value)}>
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0" fill="none">
     <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
    Send selection list
   </Button>
  </div>
  {disabled?<p role="status" className="text-sm text-warning-text">This drive is closed; selection submissions are unavailable.</p>:null}
  {!disabled&&candidates.length===0?<p role="status" className="text-sm text-body">No applicants have passed every completed assessment and interview round on this page.</p>:null}
  {success?<p role="status" className="text-sm text-success">{success}</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
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
     Select all eligible on this page
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
