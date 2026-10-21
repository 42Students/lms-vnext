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
 const [mode,setMode]=useState<"ADD"|"REPLACE">("ADD");
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
   setMode("ADD");setSelected([]);setInitial(ids);setVersion(expectedUpdatedAt);setLoaded(true);
  }catch{if(sequence===requestSequence.current)
    setError("Failed to load learner options. Try again.");}
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
  if(lock.current||!loaded)return;
  const adding=selected.filter(id=>!initial.includes(id));
  const nextTotal=mode==="REPLACE"?selected.length:initial.length+adding.length;
  if(!selected.length){setError("At least one learner is required.");return;}
  if(nextTotal>500){
   setError("This workspace has "+initial.length+" active students. The requested change would bring it to "+nextTotal+"; the maximum is 500.");
   return;
  }
  lock.current=true;setBusy(true);setError("");
  try{
   const result=await apiFetch<Result>(endpoint+"/roster",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     learnerMembershipIds:selected,roleLabel:roleLabel.trim()||undefined,
     expectedUpdatedAt:version,mode,confirmRemoval:mode==="REPLACE"&&removeCount>0,
    }),
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
    "Failed to update learners. Your selected learners are kept; try again.");
  }finally{lock.current=false;setBusy(false);}
 }
 const changed=mode==="ADD"?selected.some(id=>!initial.includes(id)):
  selected.length!==initial.length||selected.some(id=>!initial.includes(id));
 const removeCount=mode==="REPLACE"?initial.filter(id=>!selected.includes(id)).length:0;
 const nextTotal=mode==="REPLACE"?selected.length:initial.length+
  selected.filter(id=>!initial.includes(id)).length;
 const removedNames=options.filter(option=>initial.includes(option.membershipId)&&
  !selected.includes(option.membershipId)).map(option=>option.displayName?.trim()||"Unnamed member");
 const removalSummary=removedNames.slice(0,10).join(", ")+
  (removedNames.length>10?" and "+(removedNames.length-10)+" more":"");
 return <>
  <Button type="button" size="sm" variant="secondary" onClick={()=>{setOpen(true);void load();}}>Manage students</Button>
  <Dialog open={open} onOpenChange={value=>{if(!busy){setOpen(value);if(!value)requestSequence.current++;}}}
   title="Manage students"
   description="Add learners to this workspace, or explicitly choose to replace existing students. All changes are saved together.">
   <div className="space-y-4">
    <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] sm:flex-row sm:items-end">
     <label className="grid min-w-0 flex-1 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search learners
      <Input value={search} onChange={event=>setSearch(event.target.value)}
       onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();void find();}}}
       maxLength={120} placeholder="Search by student name"/>
     </label>
     <Button type="button" variant="secondary" className="w-full sm:w-auto" loading={searching} disabled={searching||busy||!loaded} onClick={()=>void find()}>
      {searching?"Searching…":"Search"}
     </Button>
    </div>
    {loaded?<div className="space-y-3">
     <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-body">
      <Checkbox checked={mode==="REPLACE"} disabled={busy}
       onChange={event=>{
        const replacing=event.target.checked;
        setMode(replacing?"REPLACE":"ADD");
        setSelected(replacing?[...initial]:[]);
        setError("");
       }}/>
      Replace existing learners (unchecked appends instead)
     </label>
     <p className="text-xs text-muted-foreground" role="status">
      {mode==="ADD"?"Adding to "+initial.length+" existing students. No current learner will be removed.":
        "Replacement starts with all "+initial.length+" current students selected. Deselect a learner to remove them."}
     </p>
     <fieldset disabled={busy} tabIndex={0} aria-describedby={error?"roster-selection-error":undefined} className="max-h-64 min-w-0 divide-y divide-[var(--lms-canvas-border)] overflow-y-auto overscroll-contain border-y border-[var(--lms-canvas-border)] px-[var(--lms-space-2)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)]">
     <legend className="px-[var(--lms-space-2)] text-[13px] font-semibold leading-5">
      Students (required) · {selected.length} selected · {nextTotal} of 500 total
     </legend>
     {options.filter(option=>mode==="REPLACE"||!initial.includes(option.membershipId))
      .map(option=><label key={option.membershipId} className="flex min-h-11 min-w-0 items-center gap-[var(--lms-space-2)] py-[var(--lms-space-2)] text-[13px] leading-5">
      <Checkbox className="size-4" checked={selected.includes(option.membershipId)}
       onChange={event=>setSelected(previous=>event.target.checked?
        ((mode==="REPLACE"?previous.length:initial.length+previous.length)>=500
          ?previous:[...previous,option.membershipId]):previous.filter(id=>id!==option.membershipId))}/>
      <span className="min-w-0 break-words">{option.displayName??option.email??"Learner"}</span>
     </label>)}
     {!options.length?<p className="text-sm text-muted-foreground leading-[22px]">No eligible learners available. Search by name or email.</p>:null}
     {nextTotal>=500?<p role="status" className="text-sm text-muted-foreground">Maximum 500 students can be selected.</p>:null}
     </fieldset>
    </div>:searching?<LoadingState label="Loading eligible learners…"/>:error?<p role="alert" className="text-[13px] leading-5 text-[var(--lms-error-text)]">{error}</p>:null}
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Role label (optional)
     <Input value={roleLabel} onChange={event=>setRoleLabel(event.target.value)} maxLength={120} placeholder="Project Contributor"/>
    </label>
    <p className="max-w-prose border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] text-[13px] leading-5 text-[var(--lms-body-text)]">Add students without affecting current members, or explicitly replace the roster. Replacing ends active membership for unselected students but retains earlier project work. Class-managed teams are changed in their own workspace.</p>
    {error&&loaded?<p id="roster-selection-error" role="alert" className="text-[13px] leading-5 text-[var(--lms-error-text)]">{error}</p>:null}
    <div className="flex flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end">
     <Button type="button" variant="secondary" className="w-full sm:w-auto" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button>
     <Button type="button" className="w-full sm:w-auto" loading={busy} disabled={busy||!loaded||!changed||nextTotal>500}
      onClick={()=>setConfirmOpen(true)}>
      {busy?"Saving…":mode==="REPLACE"?"Replace roster":"Add students"}
     </Button>
    </div>
   </div>
  </Dialog>
  <ConfirmDialog open={confirmOpen} onOpenChange={value=>{if(!busy)setConfirmOpen(value);}}
   title={mode==="REPLACE"?"Replace workspace roster"+(removeCount?" and remove "+removeCount+" learner(s)?":"?"):"Add selected students?"}
   description={mode==="REPLACE"&&removeCount?
    "Remove: "+removalSummary+". These learners lose active access, but their previous project work is retained.":
    mode==="REPLACE"?"Keep the selected learners as the complete workspace roster.":
    "Add "+selected.length+" student(s) to the existing "+initial.length+" workspace learners without removing anyone."}
   confirmLabel={mode==="REPLACE"?"Replace roster":"Add students"}
   confirmVariant={mode==="REPLACE"&&removeCount>0?"danger":"primary"} pending={busy} onConfirm={()=>void save()}/>
 </>;
}
