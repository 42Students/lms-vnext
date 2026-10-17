"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";

type Kind="TALK"|"TEST"|"VENDOR_TEST"|"GD"|"INTERVIEW";
type Row={id:string;name:string;kind:string;mode:string|null;status:string;
 createdByYou:boolean;updatedAt:string};
const kinds:readonly [Kind,string][]=[
 ["TALK","Company talk"],["TEST","Online test"],["VENDOR_TEST","Vendor test"],
 ["GD","Group discussion"],["INTERVIEW","Interview"],
];
const field="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground";

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
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const {pending,run}=useGuardedAction({timeoutMs:30000});
 const reset=()=>{setOpen(false);setConfirmRemove(false);setActive(null);setName("");setError("");};
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
     encodeURIComponent(jobId)+"/rounds",{method:"POST",body:form,redirect:"manual"});
    if(!(response.type==="opaqueredirect"||response.status===303||response.ok)){
     throw new Error(response.status===409?
      "This round changed or has results or slots. Refresh and try again.":
      "Could not save this round. Try again.");
    }
    reset();setNotice(action==="CREATE"?
     "Round added. The placement cell will set its date.":
     action==="UPDATE"?"Round updated":"Round removed");
    router.refresh();
   });
  }catch(reason){setError(reason instanceof Error?reason.message:"Could not save this round. Try again.");}
 }
 const canEdit=(row:Row)=>row.createdByYou&&row.status==="PENDING";
 return <div className="space-y-3">
  {!readOnly?<button type="button" onClick={()=>edit(null)}
   className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
   Add a round</button>:null}
  {notice?<p role="status" className="text-sm text-success">{notice}</p>:null}
  {error&&!open?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {!readOnly?<div className="flex flex-wrap gap-2">{rows.filter(canEdit).map(row=>
   <button key={row.id} type="button" onClick={()=>edit(row)}
    className="min-h-10 rounded-md border border-border px-3 text-xs font-semibold text-primary-text">
    Change / Remove: {row.name}
   </button>)}</div>:null}
  {open?<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
   <section role="dialog" aria-modal="true" aria-labelledby="recruiter-round-modal-title"
    className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-surface p-5 shadow-xl">
    <h3 id="recruiter-round-modal-title" className="font-semibold text-foreground">
     {active?"Change round":"Add a round"}</h3>
    <form onSubmit={(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();void submit(active?"UPDATE":"CREATE");}}
     className="space-y-3">
     <label className="grid gap-1 text-sm text-body">Type
      <select value={kind} onChange={e=>setKind(e.target.value as Kind)} className={field}>
       {kinds.map(([id,label])=><option value={id} key={id}>{label}</option>)}
      </select></label>
     <label className="grid gap-1 text-sm text-body">Name
      <input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} className={field}/>
     </label>
     <label className="grid gap-1 text-sm text-body">Where
      <select value={mode} onChange={e=>setMode(e.target.value)} className={field}>
       <option value="">Date to be decided</option>
       <option value="ON_CAMPUS">On campus</option>
       <option value="VIRTUAL">Online</option>
      </select></label>
     {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
     <div className="flex flex-wrap justify-end gap-2">
      {active?<button type="button" disabled={pending} onClick={()=>setConfirmRemove(true)}
       className="min-h-11 rounded-md border border-error px-3 text-sm text-error">Remove</button>:null}
      <button type="button" disabled={pending} onClick={reset}
       className="min-h-11 rounded-md border border-border px-3 text-sm">Cancel</button>
      <button type="submit" disabled={pending}
       className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary">
       {pending?"Saving…":active?"Save changes":"Add round"}</button>
     </div>
    </form>
    <ConfirmActionDialog open={confirmRemove} title="Remove this round?"
     consequence="This removes the pending round from the drive. Results and confirmed slots cannot be removed."
     confirmLabel="Remove round" pending={pending}
     onCancel={()=>setConfirmRemove(false)} onConfirm={()=>void submit("REMOVE")}/>
   </section>
  </div>:null}
 </div>;
}
