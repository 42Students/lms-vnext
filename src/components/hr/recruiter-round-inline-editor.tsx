"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {isVerifiedHrRoundMutation,hrRoundEditorHasUnsavedChanges} from "@/modules/placements/hr-round-editor-model";

type Kind="TALK"|"TEST"|"VENDOR_TEST"|"GD"|"INTERVIEW";
type Row={id:string;name:string;kind:string;mode:string|null;status:string;
 createdByYou:boolean;updatedAt:string};
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
 const {pending,run}=useGuardedAction({timeoutMs:30000});
 const reset=()=>{setOpen(false);setConfirmRemove(false);setConfirmDiscard(false);setActive(null);setName("");setError("");};
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
  setMode(row?.mode??"");setError("");setOpen(true);setNotice("");
 }
 async function submit(action:"CREATE"|"UPDATE"|"REMOVE"){
  if(pending||readOnly)return;
  setError("");
  if(action!=="REMOVE"&&!name.trim()){setError("Enter a round name");return;}
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
 const canEdit=(row:Row)=>row.createdByYou&&row.status==="PENDING";
 return <div className="space-y-3">
  {!readOnly?<Button variant="primary" type="button" onClick={()=>edit(null)}
  >
   Add a round</Button>:null}
  {notice?<p role="status" className="text-sm text-success">{notice}</p>:null}
  {error&&!open?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {!readOnly?<div className="flex flex-wrap gap-2">{rows.filter(canEdit).map(row=>
   <Button variant="primary" key={row.id} type="button" onClick={()=>edit(row)}
   >
    Change / Remove: {row.name}
   </Button>)}</div>:null}
  <Dialog open={open} onOpenChange={next=>{if(!next)requestClose();}}
    dismissible={!pending} title={active?"Change round":"Add a round"}>
    <form onSubmit={(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();void submit(active?"UPDATE":"CREATE");}}
     className="space-y-3">
     <label className="grid gap-1 text-sm text-body">Type
      <Select value={kind} onChange={e=>setKind(e.target.value as Kind)} className="w-full">
       {kinds.map(([id,label])=><option value={id} key={id}>{label}</option>)}
      </Select></label>
     <label className="grid gap-1 text-sm text-body">Name
      <Input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} className="w-full"/>
     </label>
     <label className="grid gap-1 text-sm text-body">Where
      <Select value={mode} onChange={e=>setMode(e.target.value)} className="w-full">
       <option value="">Date to be decided</option>
       <option value="ON_CAMPUS">On campus</option>
       <option value="VIRTUAL">Online</option>
      </Select></label>
     {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
     <div className="flex flex-wrap justify-end gap-2">
      {active?<Button variant="secondary" className="border-error text-error" type="button" disabled={pending} onClick={()=>setConfirmRemove(true)}
      >Remove</Button>:null}
      <Button variant="secondary" type="button" disabled={pending} onClick={requestClose}
      >Cancel</Button>
      <Button variant="primary" type="submit" disabled={pending}
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
