"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Input} from "@/components/ui/input";
import {LoadingState} from "@/components/ui/loading-state";
import {Checkbox} from "@/components/ui/checkbox";
import {Select} from "@/components/ui/select";
import {collegeProjectRosterCapacity} from "@/modules/projects/college-project-roster-model";
import {useToast} from "@/components/ui/toast";

type Candidate={membershipId:string;displayName:string|null;email:string|null};
type Member=Candidate&{role:string;id:string};
type Result={added:number;removed:number;updatedAt:string};

/** COL-projects-15: append by default; explicit replacement is atomic and confirmed. */
export function CollegeProjectStudentRosterDialog({projectId,expectedUpdatedAt}:{
 projectId:string;expectedUpdatedAt:string;
}){
 const router=useRouter(),{showToast}=useToast();
 const lock=useRef(false);
 const requestSequence=useRef(0);
 const [open,setOpen]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const [busy,setBusy]=useState(false);
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [mode,setMode]=useState<"ADD"|"REPLACE">("ADD");
 const [optionLimit,setOptionLimit]=useState(100);
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
  const sequence=++requestSequence.current;
  setError("");setLoaded(false);setSearching(true);setMode("ADD");setOptionLimit(100);
  try{
   const [members,candidates]=await Promise.all([
    apiFetch<{members:Member[]}>(endpoint+"/members",{cache:"no-store"}),
    apiFetch<{candidates:Candidate[]}>(endpoint+"/member-candidates?role=LEARNER&limit=20",{cache:"no-store"}),
   ]);
   if(sequence!==requestSequence.current)return;
   const learners=members.members.filter(member=>member.role==="LEARNER");
   const choices=[...learners,...candidates.candidates];
   setOptions([...new Map(choices.map(candidate=>[candidate.membershipId,candidate])).values()]);
   const ids=learners.map(x=>x.membershipId);
   setSelected([]);setInitial(ids);setVersion(expectedUpdatedAt);setLoaded(true);
  }catch{if(sequence===requestSequence.current)setError("Failed to load students. Try again.");}
  finally{if(sequence===requestSequence.current)setSearching(false);}
 }
 async function find(){
  if(searching||busy)return;
  const sequence=++requestSequence.current;
  setSearching(true);setError("");
  try{
   const params=new URLSearchParams({role:"LEARNER",q:search.trim(),limit:"20"});
   const response=await apiFetch<{candidates:Candidate[]}>(endpoint+"/member-candidates?"+params,{cache:"no-store"});
   if(sequence===requestSequence.current)
    setOptions(previous=>[...new Map([...previous,...response.candidates].map(row=>[row.membershipId,row])).values()]);
  }catch{if(sequence===requestSequence.current)setError("Failed to search students. Your selections have been kept.");}
  finally{if(sequence===requestSequence.current)setSearching(false);}
 }
 async function save(){
  if(lock.current||!loaded||!capacity.allowed||!changed)return;
   lock.current=true;setBusy(true);setError("");
  try{
   const result=await apiFetch<Result>(endpoint+"/roster",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({learnerMembershipIds:selected,mode,
      confirmRemoval:mode==="REPLACE"&&removeCount>0,
      roleLabel:roleLabel.trim()||undefined,expectedUpdatedAt:version}),
   });
   setVersion(result.updatedAt);
   setInitial(mode==="REPLACE"?[...selected]:[...new Set([...initial,...selected])]);
   setSelected([]);setConfirmOpen(false);setOpen(false);
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
 const changed=mode==="ADD"?selected.some(id=>!initial.includes(id)):
  selected.length!==initial.length||selected.some(id=>!initial.includes(id));
 const removeCount=mode==="REPLACE"?initial.filter(id=>!selected.includes(id)).length:0;
 const capacity=collegeProjectRosterCapacity(initial,selected,mode==="REPLACE");
 return <>
  <Button type="button" size="sm" variant="secondary" onClick={()=>{setOpen(true);void load();}}>Manage students</Button>
  <Dialog open={open} onOpenChange={value=>{if(!busy){setOpen(value);if(!value)requestSequence.current++;}}}
   title="Manage students"
   description="Choose learners for this workspace. Changes are saved together only after confirmation.">
   <div className="space-y-4">
    <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] sm:flex-row sm:items-end">
     <label className="grid min-w-0 flex-1 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search learners
      <Input value={search} onChange={event=>setSearch(event.target.value)} maxLength={120} placeholder="Name or email"/>
     </label>
     <Button type="button" variant="secondary" className="w-full sm:w-auto" loading={searching} disabled={searching||busy||!loaded} onClick={()=>void find()}>
      {searching?"Searching…":"Search"}
     </Button>
    </div>
    <label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">Update mode
      <Select value={mode} onChange={event=>{const next=event.target.value as "ADD"|"REPLACE";
        setMode(next);setSelected(next==="REPLACE"?[...initial]:[]);setError("");}} disabled={busy}>
        <option value="ADD">Add students (keep current roster)</option>
        <option value="REPLACE">Replace existing students</option>
      </Select>
    </label>
    {loaded?<fieldset disabled={busy} tabIndex={0} className="max-h-64 min-w-0 divide-y divide-[var(--lms-canvas-border)] overflow-y-auto overscroll-contain border-y border-[var(--lms-canvas-border)] px-[var(--lms-space-2)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)]">
     <legend className="px-[var(--lms-space-2)] text-[13px] font-semibold leading-5">Learners ({capacity.total} total after save, maximum 500)</legend>
     {options.slice(0,optionLimit).map(option=><label key={option.membershipId} className="flex min-h-11 min-w-0 items-center gap-[var(--lms-space-2)] py-[var(--lms-space-2)] text-[13px] leading-5">
      <Checkbox className="size-4"
       disabled={mode==="ADD"&&initial.includes(option.membershipId)}
       checked={selected.includes(option.membershipId)||(mode==="ADD"&&initial.includes(option.membershipId))}
       onChange={event=>setSelected(previous=>event.target.checked?
        [...previous,option.membershipId]:previous.filter(id=>id!==option.membershipId))}/>
      <span className="min-w-0 break-words">{option.displayName??option.email??"Learner"}</span>
     </label>)}
     {!options.length?<p className="text-sm text-muted-foreground leading-[22px]">No eligible learners available.</p>:null}
    </fieldset>:searching?<LoadingState label="Loading eligible learners…"/>:error?<p role="alert" className="text-[13px] leading-5 text-[var(--lms-error-text)]">{error}</p>:null}
    {options.length>optionLimit?<Button type="button" variant="secondary" disabled={busy}
      onClick={()=>setOptionLimit(value=>value+100)}>Show more students</Button>:null}
    {!capacity.allowed?<p role="alert" className="text-sm text-error">{capacity.message}</p>:null}
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Role label (optional)
     <Input value={roleLabel} onChange={event=>setRoleLabel(event.target.value)} maxLength={120}/>
    </label>
    <p className="max-w-prose border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] text-[13px] leading-5 text-[var(--lms-body-text)]">{mode==="ADD"?"New students are added without removing existing learners.": "Replacing the roster ends membership for unselected learners; previous project work is retained."} Class-managed teams must be changed through the class team workspace.</p>
    {error&&loaded?<p role="alert" className="text-[13px] leading-5 text-[var(--lms-error-text)]">{error}</p>:null}
    <div className="flex flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end">
     <Button type="button" variant="secondary" className="w-full sm:w-auto" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button>
     <Button type="button" className="w-full sm:w-auto" loading={busy} disabled={busy||!loaded||!changed||!capacity.allowed} onClick={()=>setConfirmOpen(true)}>
      {busy?"Saving…":mode==="ADD"?"Add students":"Replace roster"}
     </Button>
    </div>
   </div>
  </Dialog>
  <ConfirmDialog open={confirmOpen} onOpenChange={value=>{if(!busy)setConfirmOpen(value);}}
   title={mode==="ADD"?"Add "+selected.length+" learner(s) to this workspace?":"Remove "+removeCount+" learner(s) from this workspace?"}
   description={mode==="ADD"?"Existing learners stay assigned. Confirm the new additions.":
     "Learners removed from the roster lose active access, but their previous project work is retained."}
   confirmLabel={mode==="ADD"?"Add students":"Replace roster"} pending={busy} onConfirm={()=>void save()}/>
 </>;
}
