"use client";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";
import {Dialog} from "@/components/ui/dialog";
import {isVerifiedHrRoundMutation,hrRoundEditorHasUnsavedChanges} from "@/modules/placements/hr-round-editor-model";

type Kind="TALK"|"TEST"|"VENDOR_TEST"|"GD"|"INTERVIEW";
type Row={id:string;name:string;kind:string;mode:string|null;status:string;
 createdByYou:boolean;updatedAt:string;inUse?:boolean};
const kinds:readonly [Kind,string][]=[
 ["TALK","Company talk"],["TEST","Online test"],["VENDOR_TEST","Vendor test"],
 ["GD","Group discussion"],["INTERVIEW","Interview"],
];

/** REC-home-drives-46: accessible inline authoring. Server still enforces
 * author-only, pending and no existing results/slots. Never trust client flags. */
export function RecruiterRoundInlineEditor({jobId,rows,readOnly}:{
 jobId:string;rows:readonly Row[];readOnly:boolean;
}){
 const router=useRouter();
 const [active,setActive]=useState<Row|null>(null);
 const [open,setOpen]=useState(false);
 const [name,setName]=useState("");
 const [kind,setKind]=useState<Kind>("INTERVIEW");
 const [mode,setMode]=useState("");
 const [confirmRemove,setConfirmRemove]=useState(false);
 const [confirmDiscard,setConfirmDiscard]=useState(false);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [nameError,setNameError]=useState("");
 const {pending,run}=useGuardedAction({timeoutMs:30000});
 const reset=()=>{setOpen(false);setConfirmRemove(false);setConfirmDiscard(false);setActive(null);setName("");setError("");setNameError("");};
 const dirty=hrRoundEditorHasUnsavedChanges({name,kind,mode},active);
 function requestClose(){
  if(pending)return;
  if(dirty){setConfirmDiscard(true);return;}
  reset();
 }
 function edit(row:Row|null){
  if(pending||readOnly)return;
  setActive(row);setName(row?.name??"");
  setKind(kinds.some(item=>item[0]===row?.kind)?row!.kind as Kind:"INTERVIEW");
  setMode(row?.mode??"");setError("");setNameError("");setOpen(true);setNotice("");
 }
 async function submit(action:"CREATE"|"UPDATE"|"REMOVE"){
  if(pending||readOnly)return;
  setError("");setNameError("");
  if(action!=="REMOVE"&&!name.trim()){setNameError("Give the round a name");return;}
  const form=new FormData();
  form.set("action",action);
  if(action!=="REMOVE"){
   form.set("name",name.trim());form.set("kind",kind);form.set("mode",mode);
  }
  if(action!=="CREATE"){
   if(!active){setError("Choose a round first");return;}
   form.set("roundId",active.id);form.set("expectedUpdatedAt",active.updatedAt);
  }
  try{
   await run(async()=>{
    const response=await fetch("/api/placements/recruiter/drives/"+
     encodeURIComponent(jobId)+"/rounds",{
      method:"POST",body:form,credentials:"same-origin",redirect:"error",
      headers:{Accept:"application/json"},
     });
    if(!response.ok){
     throw new Error(response.status===409?
      "This round changed or has results or slots. Refresh and try again.":
      "Could not save this round. Try again.");
    }
    const receipt:unknown=await response.json().catch(()=>null);
    if(!isVerifiedHrRoundMutation(receipt,action,active?.id??null))
     throw new Error("Could not verify this round was saved. Check the drive before retrying.");
    reset();setNotice(action==="CREATE"?
     "Round added. The placement cell will set its date.":
     action==="UPDATE"?"Round updated":"Round removed");
    router.refresh();
   });
  }catch(reason){setError(reason instanceof Error?reason.message:"Could not save this round. Try again.");}
 }
 const canEdit=(row:Row)=>row.createdByYou&&row.status==="PENDING"&&!row.inUse;
 return <div className="space-y-3">
  {!readOnly?<Button type="button" onClick={()=>edit(null)}
   variant="primary" className="min-h-11 w-full md:w-auto md:min-h-9">
   Add a round</Button>:null}
  {notice?<InlineNotice tone="success" message={notice}/>:null}
  {error&&!open?<InlineNotice tone="error" message={error}/>:null}
  {!readOnly&&rows.some(canEdit)?<details className="min-w-0 border-t border-border pt-2"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Change / Remove</summary><div className="mt-2 flex min-w-0 flex-col items-stretch gap-2 md:flex-row md:flex-wrap">{rows.filter(canEdit).map(row=>
   <Button key={row.id} type="button" onClick={()=>edit(row)}
    variant="secondary" className="min-h-11 w-full min-w-0 break-words md:w-auto md:min-h-9">
    Change / Remove: {row.name}
   </Button>)}</div></details>:null}
  <Dialog open={open} onOpenChange={next=>{if(!next)requestClose();}}
    dismissible={!pending} title={active?"Change round":"Add a round"}>
    <form onSubmit={(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();void submit(active?"UPDATE":"CREATE");}}
     className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
     <label className="grid min-w-0 gap-[6px] md:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name
      <Input required maxLength={100} value={name} aria-invalid={Boolean(nameError)}
       aria-describedby={nameError?"round-name-error":undefined}
       onChange={e=>{setName(e.target.value);setNameError("");}} className="w-full"/>
      {nameError?<span id="round-name-error" role="alert" className="text-xs font-normal text-error">{nameError}</span>:null}
     </label>
     <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Type
      <Select value={kind} onChange={e=>setKind(e.target.value as Kind)} className="w-full">
       {kinds.map(([id,label])=><option value={id} key={id}>{label}</option>)}
      </Select></label>
     <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Where
      <Select value={mode} onChange={e=>setMode(e.target.value)} className="w-full">
       <option value="">Date to be decided</option>
       <option value="ON_CAMPUS">On campus</option>
       <option value="VIRTUAL">Online</option>
      </Select></label>
     {error?<div className="md:col-span-2"><InlineNotice tone="error" message={error}/></div>:null}
     {active?<details className="min-w-0 border-t border-border pt-3 md:col-span-2"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Remove</summary><Button type="button" disabled={pending} onClick={()=>setConfirmRemove(true)}
       variant="secondary" className="mt-2 min-h-11 w-full border-error text-error md:w-auto md:min-h-9">Remove</Button></details>:null}
     <div className="flex min-w-0 flex-wrap justify-end gap-2 md:col-span-2 [&_button]:flex-1 sm:[&_button]:flex-none">
      <Button type="button" disabled={pending} onClick={requestClose}
       variant="secondary">Cancel</Button>
      <Button type="submit" loading={pending} disabled={pending}
       >
       {pending?"Saving…":active?"Save changes":"Add round"}</Button>
     </div>
    </form>
    <ConfirmActionDialog open={confirmDiscard} title="Discard unsaved round changes?"
     consequence="Your changes to this round will not be saved."
     confirmLabel="Discard" pending={pending}
     onCancel={()=>setConfirmDiscard(false)} onConfirm={reset}/>
    <ConfirmActionDialog open={confirmRemove} title="Remove this round?"
     consequence="This removes the pending round from the drive. Results and confirmed slots cannot be removed."
     confirmLabel="Remove round" pending={pending}
     onCancel={()=>setConfirmRemove(false)} onConfirm={()=>void submit("REMOVE")}/>
  </Dialog>
 </div>;
}
