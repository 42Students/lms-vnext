"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {useToast} from "@/components/ui/toast";
import {apiFetch} from "@/lib/api-fetch";
import {projectMutation} from "./project-api";

type Mentor={membershipId:string;displayName:string|null;email:string|null};
type ReassignOutcome={reassignedCount:number;skippedCount:number;failures:{projectId:string;code:string}[]};

/** COL-projects-15: single workspace version of the scoped bulk reassignment. */
export function CollegeProjectMentorDialog({projectId,collegeId}:{
 projectId:string;collegeId:string;
}){
 const router=useRouter();
 const {showToast}=useToast();
 const lock=useRef(false);
 const [open,setOpen]=useState(false);
 const [search,setSearch]=useState("");
 const [mentors,setMentors]=useState<Mentor[]>([]);
 const [mentorId,setMentorId]=useState("");
 const [roleLabel,setRoleLabel]=useState("");
 const [busy,setBusy]=useState(false);
 const [searching,setSearching]=useState(false);
 const [error,setError]=useState("");
 async function load(){
  if(searching)return;
  setSearching(true);setError("");
  try{
   const params=new URLSearchParams({role:"MENTOR",q:search.trim(),limit:"20"});
   const data=await apiFetch<{candidates:Mentor[]}>(
    "/api/projects/"+encodeURIComponent(projectId)+"/member-candidates?"+params,{cache:"no-store"});
   setMentors(data.candidates);setMentorId(current=>data.candidates.some(m=>m.membershipId===current)?current:data.candidates[0]?.membershipId??"");
  }catch{
   setError("Could not load mentors. Try searching again.");
  }finally{setSearching(false);}
 }
 async function reassign(){
  if(lock.current||!mentorId)return;
  const mentor=mentors.find(x=>x.membershipId===mentorId);
  if(!mentor)return;
  lock.current=true;setBusy(true);setError("");
  try{
   const result=await projectMutation("/api/projects/reassign-mentor","POST",{
    collegeId,projectIds:[projectId],mentorMembershipId:mentorId,roleLabel:roleLabel.trim()||"Project Mentor",
   }) as ReassignOutcome;
   if(result.reassignedCount!==1){
    setError(result.skippedCount>0?"This workspace already has the selected mentor.":"Could not reassign this workspace. Your selection has been kept.");
    return;
   }
   setOpen(false);
   showToast({tone:"success",title:"Mentor assigned",description:"The primary mentor was updated for this workspace."});
   router.refresh();
  }catch{
   setError("Could not reassign the mentor. Your selection has been kept. Try again.");
  }finally{lock.current=false;setBusy(false);}
 }
 return <>
  <Button size="sm" variant="secondary" onClick={()=>{setOpen(true);setError("");void load();}}>
   Reassign mentor
  </Button>
  <Dialog open={open} onOpenChange={next=>{if(!busy)setOpen(next);}}
   title="Reassign mentor"
   description="Choose an eligible mentor for this workspace. The outgoing primary mentor will be replaced.">
   <div className="space-y-4">
    <div className="flex flex-wrap items-end gap-2">
     <label className="grid flex-1 gap-1 text-sm font-semibold">Search mentors
      <Input value={search} onChange={e=>setSearch(e.target.value)} maxLength={120} placeholder="Name or email"/>
     </label>
     <Button type="button" variant="secondary" disabled={searching||busy} onClick={()=>void load()}>
      {searching?"Searching…":"Search"}
     </Button>
    </div>
    <label className="grid gap-1 text-sm font-semibold">New primary mentor
     <Select value={mentorId} onChange={e=>setMentorId(e.target.value)} disabled={searching||busy}>
      <option value="">Select a mentor</option>
      {mentors.map(mentor=><option key={mentor.membershipId} value={mentor.membershipId}>
       {mentor.displayName??mentor.email??"Mentor"}
      </option>)}
     </Select>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Role label (optional)
     <Input value={roleLabel} onChange={e=>setRoleLabel(e.target.value)} maxLength={120} placeholder="Project Mentor"/>
    </label>
    <p className="text-sm text-body">The previous primary mentor will be replaced. Co-mentors remain assigned. Scheduled meetings and task assignments may change.</p>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    <div className="flex justify-end gap-2">
     <Button type="button" variant="secondary" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button>
     <Button type="button" disabled={!mentorId||busy||searching} onClick={()=>void reassign()}>
      {busy?"Reassigning…":"Confirm reassignment"}
     </Button>
    </div>
   </div>
  </Dialog>
 </>;
}
