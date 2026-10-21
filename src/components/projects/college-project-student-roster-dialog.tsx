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
 const [page,setPage]=useState(1);
 const [searchErrors,setSearchErrors]=useState("");
 const sequence=useRef(0);
 const [version,setVersion]=useState(expectedUpdatedAt);
 const [roleLabel,setRoleLabel]=useState("");
 const [error,setError]=useState("");
 const endpoint="/api/projects/"+encodeURIComponent(projectId);
 async function load(){
  const request=++sequence.current;
  setError("");setSearchErrors("");setLoaded(false);setSearching(true);setMode("ADD");setPage(1);
  try{
   const [members,candidates]=await Promise.all([
    apiFetch<{members:Member[]}>(endpoint+"/members",{cache:"no-store"}),
    apiFetch<{candidates:Candidate[]}>(endpoint+"/member-candidates?role=LEARNER&limit=20",{cache:"no-store"}),
   ]);
   if(request!==sequence.current)return;
   const learners=members.members.filter(member=>member.role==="LEARNER");
   const choices=[...learners,...candidates.candidates];
   setOptions([...new Map(choices.map(candidate=>[candidate.membershipId,candidate])).values()]);
   const ids=learners.map(x=>x.membershipId);
   setSelected([]);setInitial(ids);setVersion(expectedUpdatedAt);setLoaded(true);
  }catch{if(request===sequence.current)setError("Failed to load learners. Try again.");}
  finally{if(request===sequence.current)setSearching(false);}
 }
 async function find(){
  if(busy||!loaded)return;
  const request=++sequence.current;
  setSearching(true);setSearchErrors("");setPage(1);
  try{
   const params=new URLSearchParams({role:"LEARNER",q:search.trim(),limit:"20"});
   const response=await apiFetch<{candidates:Candidate[]}>(endpoint+"/member-candidates?"+params,{cache:"no-store"});
   if(request!==sequence.current)return;
   setOptions(previous=>[...new Map([...previous,...response.candidates].map(row=>[row.membershipId,row])).values()]);
  }catch{if(request===sequence.current)setSearchErrors(
   search.trim()?"Failed to search learners. Try again.":"Failed to load learners. Try again.");
  }finally{if(request===sequence.current)setSearching(false);}
 }
 const effectiveIds=mode==="REPLACE"?selected:
   [...new Set([...initial,...selected])];
 const removedIds=mode==="REPLACE"?initial.filter(id=>!selected.includes(id)):[];
 const additions=effectiveIds.filter(id=>!initial.includes(id));
 const capExceeded=effectiveIds.length>500;
 const changed=additions.length>0||removedIds.length>0;
 const removedNames=removedIds.map(id=>options.find(row=>row.membershipId===id)?.displayName??
   options.find(row=>row.membershipId===id)?.email??id);
 const visibleOptions=options.filter(option=>
   !search.trim()||[option.displayName,option.email].some(v=>
     v?.toLowerCase().includes(search.toLowerCase())));
 const lastPage=Math.max(1,Math.ceil(visibleOptions.length/50));
 const currentPage=Math.min(page,lastPage);
 async function save(){
  if(lock.current||!loaded||!changed||capExceeded)return;
   lock.current=true;setBusy(true);setError("");
  try{
   const result=await apiFetch<Result>(endpoint+"/roster",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({learnerMembershipIds:mode==="REPLACE"?selected:additions,
     mode,confirmRemoval:removedIds.length>0,roleLabel:roleLabel.trim()||undefined,
     expectedUpdatedAt:version}),
   });
   setVersion(result.updatedAt);setInitial([...effectiveIds]);setConfirmOpen(false);setOpen(false);
   showToast({tone:"success",title:"Learners assigned successfully",
    description:result.added+" added · "+result.removed+" removed."});
   router.refresh();
  }catch(cause){
   setConfirmOpen(false);
   setError(cause instanceof FriendlyFetchError&&cause.status===409?
    "This roster changed while you were working. Your selected learners are kept. Refresh and review before retrying.":
    "Failed to update learners. Your selected learners are kept; try again.");
  }finally{lock.current=false;setBusy(false);}
 }

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
    <fieldset className="flex flex-wrap gap-3 rounded border border-border p-3">
     <legend className="text-xs font-semibold">Update mode</legend>
     <label className="flex items-center gap-2 text-sm">
      <input type="radio" name="roster-mode" checked={mode==="ADD"}
       onChange={()=>{setMode("ADD");setSelected([]);}} disabled={busy}/>
      Add learners (keep existing)
     </label>
     <label className="flex items-center gap-2 text-sm">
      <input type="radio" name="roster-mode" checked={mode==="REPLACE"}
       onChange={()=>{setMode("REPLACE");setSelected([...initial]);}} disabled={busy}/>
      Replace existing roster
     </label>
    </fieldset>
    {loaded?<fieldset disabled={busy} tabIndex={0} className="max-h-64 min-w-0 divide-y divide-[var(--lms-canvas-border)] overflow-y-auto overscroll-contain border-y border-[var(--lms-canvas-border)] px-[var(--lms-space-2)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)]">
     <legend className="px-[var(--lms-space-2)] text-[13px] font-semibold leading-5">Learners ({effectiveIds.length} total after save; {selected.length} selected in this editor)</legend>
     {visibleOptions.slice((currentPage-1)*50,currentPage*50).map(option=><label key={option.membershipId} className="flex min-h-11 min-w-0 items-center gap-[var(--lms-space-2)] py-[var(--lms-space-2)] text-[13px] leading-5">
      <Checkbox className="size-4" checked={selected.includes(option.membershipId)}
       onChange={event=>setSelected(previous=>event.target.checked?
        ((mode==="REPLACE"?previous.length:initial.length+previous.length)>=500
          ?previous:[...previous,option.membershipId]):previous.filter(id=>id!==option.membershipId))}/>
      <span className="min-w-0 break-words">{option.displayName??option.email??"Learner"}</span>
     </label>)}
     {!visibleOptions.length?<p className="text-sm text-muted-foreground leading-[22px]">No eligible learners available.</p>:null}
    </fieldset>:searching?<LoadingState label="Loading eligible learners…"/>:error?<p role="alert" className="text-[13px] leading-5 text-[var(--lms-error-text)]">{error}</p>:null}
    {loaded&&visibleOptions.length>50?<div className="flex flex-wrap items-center gap-2 text-sm">
     <span>Page {currentPage} of {lastPage}</span>
     <Button variant="secondary" size="sm" disabled={currentPage===1}
      onClick={()=>setPage(n=>Math.max(1,n-1))}>Previous</Button>
     <Button variant="secondary" size="sm" disabled={currentPage===lastPage}
      onClick={()=>setPage(n=>Math.min(lastPage,n+1))}>Next</Button>
    </div>:null}
    {searchErrors?<p role="alert" className="text-sm text-error">{searchErrors}</p>:null}
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Role label (optional)
     <Input value={roleLabel} onChange={event=>setRoleLabel(event.target.value)} maxLength={120} placeholder="Project Contributor"/>
    </label>
    <p className="max-w-prose border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] text-[13px] leading-5 text-[var(--lms-body-text)]">{mode==="ADD"?"Add learners preserves all existing members and their earlier work.":
     "Replace roster ends access for unchecked existing learners after confirmation; past work is retained."}
     Class-managed teams must be changed through the class team workspace.</p>
    {capExceeded?<p role="alert" className="text-sm text-error">
      This would exceed the 500-learner limit. Remove {effectiveIds.length-500} selections.
    </p>:null}
    {error&&loaded?<p role="alert" className="text-[13px] leading-5 text-[var(--lms-error-text)]">{error}</p>:null}
    <div className="flex flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end">
     <Button type="button" variant="secondary" className="w-full sm:w-auto" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button>
     <Button type="button" className="w-full sm:w-auto" loading={busy} disabled={busy||!loaded||!changed||capExceeded} onClick={()=>{if(removedIds.length>0)setConfirmOpen(true);else void save();}}>
      {busy?"Saving…":mode==="ADD"?"Add learners":"Replace roster"}
     </Button>
    </div>
   </div>
  </Dialog>
  <ConfirmDialog open={confirmOpen} onOpenChange={value=>{if(!busy)setConfirmOpen(value);}}
   title={mode==="REPLACE"?
     "Replace this learner roster ("+removedIds.length+" removed)?":
     "Add "+additions.length+" learner(s) to this workspace?"}
   description={mode==="REPLACE"?
     "Removed learners lose active access but retain previous work. Confirm the names below.":
     "Selected learners will be added to this workspace; existing learners remain."}
   confirmLabel={mode==="REPLACE"?"Replace roster":"Add learners"}
   pending={busy} onConfirm={()=>void save()}>
   {mode==="REPLACE"&&removedNames.length?<div className="max-h-40 overflow-auto text-sm">
    <p className="font-semibold">Learners losing access</p>
    <ul className="list-disc pl-5">{removedNames.map((name,i)=>
     <li key={removedIds[i]}>{name}</li>)}</ul>
   </div>:null}
  </ConfirmDialog>
 </>;
}
