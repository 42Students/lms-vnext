"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";

export function MentorTaskCreate({
  projectId,sprintId,updatedAt,sprints=[],learners=[],
}:{projectId:string;sprintId:string;updatedAt:string;
  sprints?:readonly {id:string;title:string;status:string;updatedAt:string}[];
  learners?:readonly {membershipId:string;displayName:string|null}[];
}){
  const router=useRouter();
  const {showToast}=useToast();
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [criteria,setCriteria]=useState("");
  const [priority,setPriority]=useState<"LOW"|"MEDIUM"|"HIGH"|"CRITICAL">("MEDIUM");
  const [estimate,setEstimate]=useState("");
  const [taskType,setTaskType]=useState("");
  const [dueDate,setDueDate]=useState("");
  const [blockerReason,setBlockerReason]=useState("");
  const [selectedSprintId,setSelectedSprintId]=useState(sprintId);
  const [status,setStatus]=useState<"TODO"|"IN_PROGRESS"|"BLOCKED">("TODO");
  const [assigneeMembershipId,setAssigneeMembershipId]=useState("");
  const choices=sprints.length?sprints.filter(item=>item.status!=="COMPLETED"):
    [{id:sprintId,title:"Current sprint",status:"PLANNED",updatedAt}];
  const chosenSprint=choices.find(item=>item.id===selectedSprintId);
  const canSetStatus=status==="TODO"||chosenSprint?.status==="ACTIVE";
  const valid=title.trim().length>0&&title.trim().length<=200&&
    description.length<=4000&&criteria.length<=4000&&blockerReason.length<=4000&&
    (estimate===""||(Number.isInteger(Number(estimate))&&Number(estimate)>=0&&Number(estimate)<=1000))&&
    canSetStatus&&(status!=="BLOCKED"||Boolean(blockerReason.trim()));
  async function create(){
    if(!valid)return;
    setBusy(true);
    try{
      await projectMutation("/api/projects/"+projectId+"/tasks","POST",{
        sprintId:selectedSprintId||null,
        expectedSprintUpdatedAt:chosenSprint?.updatedAt??null,
        title:title.trim(),description:description.trim()||null,
        acceptanceCriteria:criteria.trim()||null,
        priority,expectedSprintUpdatedAt:updatedAt,
        estimatePoints:estimate!==""?Number(estimate):null,
        taskType:taskType||null,dueDate:dueDate||null,blockerReason:blockerReason.trim()||null,
      });
      showToast({tone:"success",title:"Project task created"});
      setOpen(false);setTitle("");setDescription("");setCriteria("");setPriority("MEDIUM");
      router.refresh();
    }catch(error){
      showToast({tone:"error",title:"Task was not created",
        description:error instanceof Error?error.message:"Refresh and retry."});
    }finally{setBusy(false);}
  }
  return <>
    <Button size="sm" variant="secondary" onClick={()=>setOpen(true)}>Add task</Button>
    <Dialog open={open} onOpenChange={setOpen} title="Confirm new task"
      description="Creates a TODO task in this Sprint and records an audit event."
      footer={<>
        <Button variant="secondary" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button>
        <Button disabled={busy||!valid} onClick={()=>void create()}>
          {busy?"Creating…":"Confirm create"}
        </Button>
      </>}>
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm font-semibold text-body">Task title
          <Input value={title} maxLength={200} required onChange={e=>setTitle(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Description
          <Textarea value={description} maxLength={4000} onChange={e=>setDescription(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Acceptance criteria
          <Textarea value={criteria} maxLength={4000} onChange={e=>setCriteria(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Priority
          <select value={priority} onChange={e=>setPriority(e.target.value as typeof priority)}
            className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground">
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Estimate
          <Input inputMode="numeric" type="number" min={0} max={1000} value={estimate}
            onChange={e=>setEstimate(e.target.value)}/>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Type
          <select value={taskType} onChange={e=>setTaskType(e.target.value)}
            className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground">
            <option value="">Not specified</option><option value="STORY">Story</option>
            <option value="BUG">Bug</option><option value="CHORE">Chore</option>
            <option value="SPIKE">Spike</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Due date
          <Input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Blocker reason
          <Textarea value={blockerReason} maxLength={4000}
            onChange={e=>setBlockerReason(e.target.value)}/>
        </label>
      </div>
    </Dialog>
  </>;
}
