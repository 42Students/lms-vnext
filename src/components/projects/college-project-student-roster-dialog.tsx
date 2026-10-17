"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Input} from "@/components/ui/input";
import {useToast} from "@/components/ui/toast";

type Candidate={membershipId:string;displayName:string|null;email:string|null};
type Member=Candidate&{role:string;id:string};
type Result={added:number;removed:number;updatedAt:string};

/** COL-projects-15: all learners are replaced in a single authenticated transaction, never a sequence of partial writes. */
export function CollegeProjectStudentRosterDialog({projectId,expectedUpdatedAt}:{
 projectId:string;expectedUpdatedAt:string;
}){
 const router=useRouter(),{showToast}=useToast();
 const lock=useRef(false);
 const [open,setOpen]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const [busy,setBusy]=useState(false);
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [searching,setSearching]=useState(false);
 const [search,setSearch]=useState("");
 const [options,setOptions]=useState<Candidate[]>([]);
 const [selected,setSelected]=useState<string[]>([]);
 const [initial,setInitial]=useState<string[]>([]);
 const [version,setVersion]=useState(expectedUpdatedAt);
 const [roleLabel,setRoleLabel]=useState("");
 const [error,setError]=useState("");
 const endpoint="/api/projects/"+encodeURIComponent(projectId);
 async function load(){
  setError("");setLoaded(false);setSearching(true);
  try{
   const [members,candidates]=await Promise.all([
    apiFetch<{members:Member[]}>(endpoint+"/members",{cache:"no-store"}),
    apiFetch<{candidates:Candidate[]}>(endpoint+"/member-candidates?role=LEARNER&limit=20",{cache:"no-store"}),
   ]);
   const learners=members.members.filter(member=>member.role==="LEARNER");
   const choices=[...learners,...candidates.candidates];
   setOptions([...new Map(choices.map(candidate=>[candidate.membershipId,candidate])).values()]);
   const ids=learners.map(x=>x.membershipId);
   setSelected(ids);setInitial(ids);setVersion(expectedUpdatedAt);setLoaded(true);
  }catch{setError("Could not load the learner roster. Try opening it again.");}
  finally{setSearching(false);}
 }
 async function find(){
  if(searching||busy)return;
  setSearching(true);setError("");
  try{
   const params=new URLSearchParams({role:"LEARNER",q:search.trim(),limit:"20"});
   const response=await apiFetch<{candidates:Candidate[]}>(endpoint+"/member-candidates?"+params,{cache:"no-store"});
   setOptions(previous=>[...new Map([...previous,...response.candidates].map(row=>[row.membershipId,row])).values()]);
  }catch{setError("Could not find learners. Your roster changes have been kept.");}
  finally{setSearching(false);}
 }
 async function save(){
  if(lock.current||!loaded)return;
   lock.current=true;setBusy(true);setError("");
  try{
   const result=await apiFetch<Result>(endpoint+"/roster",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({learnerMembershipIds:selected,roleLabel:roleLabel.trim()||undefined,expectedUpdatedAt:version}),
   });
   setVersion(result.updatedAt);setInitial([...selected]);setConfirmOpen(false);setOpen(false);
   showToast({tone:"success",title:"Learners updated",
    description:result.added+" added · "+result.removed+" removed."});
   router.refresh();
  }catch(cause){
   setConfirmOpen(false);
   setError(cause instanceof FriendlyFetchError&&cause.status===409?
    "This roster changed while you were working. Your selected learners are kept. Refresh and review before retrying.":
    "Could not update the roster. Your selected learners are kept; try again.");
  }finally{lock.current=false;setBusy(false);}
 }
 const changed=selected.length!==initial.length||selected.some(x=>!initial.includes(x));
 const removeCount=initial.filter(id=>!selected.includes(id)).length;
 return <>
  <Button type="button" size="sm" variant="secondary" onClick={()=>{setOpen(true);void load();}}>Manage students</Button>
  <Dialog open={open} onOpenChange={value=>{if(!busy)setOpen(value);}}
   title="Manage students"
   description="Choose learners for this workspace. Changes are saved together only after confirmation.">
   <div className="space-y-4">
    <div className="flex flex-wrap items-end gap-2">
     <label className="grid flex-1 gap-1 text-sm font-semibold">Search learners
      <Input value={search} onChange={event=>setSearch(event.target.value)} maxLength={120} placeholder="Name or email"/>
     </label>
     <Button type="button" variant="secondary" disabled={searching||busy||!loaded} onClick={()=>void find()}>
      {searching?"Searching…":"Search"}
     </Button>
    </div>
    {loaded?<fieldset disabled={busy} className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
     <legend className="text-sm font-semibold">Learners ({selected.length} selected)</legend>
     {options.map(option=><label key={option.membershipId} className="flex min-h-10 items-center gap-2 text-sm">
      <input type="checkbox" checked={selected.includes(option.membershipId)}
       onChange={event=>setSelected(previous=>event.target.checked?
        [...previous,option.membershipId]:previous.filter(id=>id!==option.membershipId))}/>
      <span>{option.displayName??option.email??"Learner"}</span>
     </label>)}
     {!options.length?<p className="text-sm text-muted-foreground">No eligible learners available.</p>:null}
    </fieldset>:<p role="status" className="text-sm">Loading eligible learners…</p>}
    <label className="grid gap-1 text-sm font-semibold">Role label (optional)
     <Input value={roleLabel} onChange={event=>setRoleLabel(event.target.value)} maxLength={120}/>
    </label>
    <p className="text-sm text-body">Replace roster will keep selected learners and end the active membership of learners you unselect. Their earlier project work is retained. Class-managed teams must be changed through the class team workspace.</p>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    <div className="flex justify-end gap-2">
     <Button type="button" variant="secondary" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button>
     <Button type="button" disabled={busy||!loaded||!changed} onClick={()=>setConfirmOpen(true)}>
      {busy?"Saving…":"Replace roster"}
     </Button>
    </div>
   </div>
  </Dialog>
  <ConfirmDialog open={confirmOpen} onOpenChange={value=>{if(!busy)setConfirmOpen(value);}}
   title={"Remove "+removeCount+" learner(s) from this workspace?"}
   description="Learners removed from the roster lose active access, but their previous project work is retained. Confirm the selected learners before replacing the roster."
   confirmLabel="Replace roster" pending={busy} onConfirm={()=>void save()}/>
 </>;
}
