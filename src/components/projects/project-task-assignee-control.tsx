"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
export function ProjectTaskAssigneeControl({projectId,taskId,taskTitle,assigneeMembershipId,updatedAt,learners}:{
  projectId:string;taskId:string;taskTitle?:string;assigneeMembershipId:string|null;updatedAt:string;
  learners:readonly {membershipId:string;displayName:string|null}[];
}){
  const router=useRouter();
  const [editing,setEditing]=useState(false);
  const [selected,setSelected]=useState(assigneeMembershipId??"");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  async function save(){
    setPending(true);setError(null);
    try{
      await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/tasks/"+
        encodeURIComponent(taskId)+"/assignee","PATCH",{
          assigneeMembershipId:selected||null,expectedUpdatedAt:updatedAt,
        });
      setEditing(false);router.refresh();
    }catch(caught){setError(caught instanceof Error?caught.message:"Task update failed");}
    finally{setPending(false);}
  }
  if(!editing)return <Button size="sm" variant="secondary" onClick={()=>setEditing(true)}>Assignee</Button>;
  return <div className="flex flex-wrap items-center gap-2">
    <label className="text-xs font-semibold text-body">Assignee
      <Select value={selected} disabled={pending} onChange={e=>setSelected(e.target.value)}
        aria-label={"Reassign "+(taskTitle??"task")+" to a team member"} className="ml-2 w-auto">
        <option value="">Unassigned</option>
        {learners.map(person=><option key={person.membershipId} value={person.membershipId}>{person.displayName ?? "Learner"}</option>)}
      </Select>
    </label>
    <Button size="sm" disabled={pending||selected===(assigneeMembershipId??"")} onClick={()=>void save()}>Save changes</Button>
    <Button size="sm" variant="secondary" disabled={pending} onClick={()=>setEditing(false)}>Cancel</Button>
    {error&&<p role="alert" className="text-xs text-error">{error}</p>}
  </div>;
}
