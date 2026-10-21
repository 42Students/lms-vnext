"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Banner} from "@/components/ui/banner";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {useToast} from "@/components/ui/toast";
import {apiFetch} from "@/lib/api-fetch";
import {projectMutation} from "./project-api";

type Mentor={membershipId:string;displayName:string|null;email:string|null};
type ReassignOutcome={reassignedCount:number;skippedCount:number;failures:{projectId:string;code:string}[]};

/** COL-projects-15: single workspace version of the scoped bulk reassignment. */
export function CollegeProjectMentorDialog({projectId,collegeId,currentMentorName}:{
 projectId:string;collegeId:string;currentMentorName?:string|null;
}){
 const router=useRouter();
 const {showToast}=useToast();
 const lock=useRef(false);
 const requestSequence=useRef(0);
 const [open,setOpen]=useState(false);
 const [search,setSearch]=useState("");
 const [mentors,setMentors]=useState<Mentor[]>([]);
 const [mentorId,setMentorId]=useState("");
 const [selectedMentor,setSelectedMentor]=useState<Mentor|null>(null);
 const [confirming,setConfirming]=useState(false);
 const [hasSearched,setHasSearched]=useState(false);
 const [mentorRequired,setMentorRequired]=useState(false);
 const [roleLabel,setRoleLabel]=useState("");
 const [busy,setBusy]=useState(false);
 const [searching,setSearching]=useState(false);
 const [error,setError]=useState("");
 async function load(query=search){
  const sequence=++requestSequence.current;
  const previousSearch=hasSearched;
  setSearching(true);setError("");
  try{
   const params=new URLSearchParams({role:"MENTOR",q:query.trim(),limit:"20"});
   const data=await apiFetch<{candidates:Mentor[]}>(
    "/api/projects/"+encodeURIComponent(projectId)+"/member-candidates?"+params,{cache:"no-store"});
   if(sequence!==requestSequence.current)return;
   setMentors(data.candidates);
   setHasSearched(true);
   // Never silently select the first faculty member or discard a selection
   // when a remote search returns a different page.
  }catch{
   if(sequence===requestSequence.current)
    setError(previousSearch||query.trim()?"Failed to search faculty. Try again.":"Failed to load faculty. Try again.");
  }finally{if(sequence===requestSequence.current)setSearching(false);}
 }
 async function reassign(){
  if(lock.current)return;
  if(!mentorId||!selectedMentor){setMentorRequired(true);setConfirming(false);return;}
  if(!confirming){setConfirming(true);return;}
  lock.current=true;setBusy(true);setError("");
  try{
   const result=await projectMutation("/api/projects/reassign-mentor","POST",{
    collegeId,projectIds:[projectId],mentorMembershipId:mentorId,roleLabel:roleLabel.trim()||"Project Mentor",
   }) as ReassignOutcome;
   if(result.reassignedCount!==1){
    const failure=result.failures.find(row=>row.projectId===projectId);
    setError(result.skippedCount>0?"This workspace already has the selected mentor.":
     failure?.code==="PROJECT_MEMBER_ROLE_REQUIRED"?"The selected faculty member no longer has an active Mentor membership in this college. Search again.":
     failure?.code==="PROJECT_INVALID_STATE"?"This workspace cannot be changed in its current state.":
     "Could not reassign this workspace. Your selection has been kept.");
    return;
   }
   setOpen(false);setConfirming(false);
   showToast({tone:"success",title:"Mentor assigned",description:"The primary mentor was updated for this workspace."});
   router.refresh();
  }catch{
   setError("Failed to assign mentor. Your selection has been kept. Try again.");
  }finally{lock.current=false;setBusy(false);}
 }
 return <>
  <Button size="sm" variant="secondary" onClick={()=>{setOpen(true);setError("");setHasSearched(false);setConfirming(false);setMentorRequired(false);setMentorId("");setSelectedMentor(null);setMentors([]);void load("");}}>
   ↻ Reassign mentor…
  </Button>
  <Dialog open={open} onOpenChange={next=>{if(!busy){setOpen(next);if(!next){requestSequence.current++;setConfirming(false);}}}}
   title="Reassign mentor"
   description="Choose an eligible mentor for this workspace. The outgoing primary mentor will be replaced.">
   <div className="space-y-4">
    <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] md:flex-row md:items-end">
     <label className="grid min-w-0 flex-1 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search mentors
      <Input value={search} onChange={e=>{setSearch(e.target.value);setConfirming(false);}}
       onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();void load(search);}}}
       maxLength={120} placeholder="Search by faculty name"/>
     </label>
     <Button type="button" variant="secondary" className="w-full md:w-auto" loading={searching} disabled={searching||busy} onClick={()=>void load()}>
      {searching?"Searching…":"Search"}
     </Button>
    </div>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Mentor
     <Select value={mentorId} onChange={e=>{const id=e.target.value;setMentorId(id);setSelectedMentor(mentors.find(m=>m.membershipId===id)??null);setMentorRequired(false);setConfirming(false);}} disabled={busy} aria-invalid={mentorRequired&&!mentorId}>
      <option value="">Select a mentor</option>
      {selectedMentor&&!mentors.some(m=>m.membershipId===selectedMentor.membershipId)?<option value={selectedMentor.membershipId}>{selectedMentor.displayName??selectedMentor.email??"Mentor"}</option>:null}
      {mentors.map(mentor=><option key={mentor.membershipId} value={mentor.membershipId}>
       {mentor.displayName??mentor.email??"Mentor"}
      </option>)}
     </Select>
     {mentorRequired&&!mentorId?<span role="alert" className="text-[12px] text-error">Mentor is required</span>:null}
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Role label (optional)
     <Input value={roleLabel} onChange={e=>setRoleLabel(e.target.value)} maxLength={120}
      title="Optional label shown on the project team roster; it does not change the mentor’s permissions."
      aria-describedby="mentor-role-label-help" placeholder="Project Mentor"/>
     <span id="mentor-role-label-help" className="text-xs font-normal leading-5 text-muted-foreground">This label appears beside the mentor on the roster; it does not change permissions.</span>
    </label>
    {!searching&&!error&&hasSearched&&mentors.length===0?<p role="status" className="text-[13px] leading-5 text-[var(--lms-muted-text)]">No eligible mentors found. Search by another name or email.</p>:null}
    <Banner tone="warning">
     Reassigning replaces the current mentor{currentMentorName?" ("+currentMentorName+")":""}:
     their meetings on this workspace are cancelled, their task assignments are cleared, and both the outgoing and incoming mentor are notified.
    </Banner>
    <a href={"/college/projects/reassign-mentor?projectId="+encodeURIComponent(projectId)} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline">Use the bulk Reassign Mentor page</a>
    {confirming?<Banner tone="warning">Confirm the reassignment to {selectedMentor?.displayName??selectedMentor?.email??"the selected mentor"}. Cancelled meetings and unassigned tasks may need rescheduling or reassignment.</Banner>:null}
    {error?<Banner tone="error">{error}</Banner>:null}
    <div className="flex flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end">
     <Button type="button" variant="secondary" className="w-full md:w-auto" disabled={busy} onClick={()=>{if(confirming)setConfirming(false);else{requestSequence.current++;setOpen(false);}}}>{confirming?"Back":"Cancel"}</Button>
     <Button type="button" className="w-full md:w-auto" loading={busy} disabled={busy||searching} onClick={()=>void reassign()}>
      {busy?"Assigning…":confirming?"Confirm assignment":"Assign"}
     </Button>
    </div>
   </div>
  </Dialog>
 </>;
}
