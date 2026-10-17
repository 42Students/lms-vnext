"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
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
  const [approach,setApproach]=useState("");
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
    sprintId?[{id:sprintId,title:"Current sprint",status:"PLANNED",updatedAt}]:[];
  const chosenSprint=choices.find(item=>item.id===selectedSprintId);
  const canSetStatus=status==="TODO"||chosenSprint?.status==="ACTIVE";
  const dirty=Boolean(title||description||approach||criteria||estimate||taskType||dueDate||blockerReason||
    priority!=="MEDIUM"||selectedSprintId!==sprintId||status!=="TODO"||assigneeMembershipId);
  function discardDraft(){
    setOpen(false);setTitle("");setDescription("");setApproach("");setCriteria("");
    setPriority("MEDIUM");setEstimate("");setTaskType("");setDueDate("");setBlockerReason("");
    setSelectedSprintId(sprintId);setStatus("TODO");setAssigneeMembershipId("");
  }
  const guard=useProjectEditorDiscardGuard(open,dirty,busy,discardDraft);
  const valid=title.trim().length>0&&title.trim().length<=200&&
    description.length<=4000&&approach.length<=4000&&criteria.length<=4000&&blockerReason.length<=4000&&
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
        approach:approach.trim()||null,
        acceptanceCriteria:criteria.trim()||null,
        priority,status,assigneeMembershipId:assigneeMembershipId||null,
        estimatePoints:estimate!==""?Number(estimate):null,
        taskType:taskType||null,dueDate:dueDate||null,blockerReason:blockerReason.trim()||null,
      });
      showToast({tone:"success",title:"Task added."});
      setOpen(false);setTitle("");setDescription("");setApproach("");setCriteria("");setPriority("MEDIUM");
      setEstimate("");setTaskType("");setDueDate("");setBlockerReason("");
      setSelectedSprintId(sprintId);setStatus("TODO");setAssigneeMembershipId("");
      router.refresh();
    }catch(error){
      showToast({tone:"error",title:"Task was not created",
        description:error instanceof Error?error.message:"Refresh and retry."});
    }finally{setBusy(false);}
  }
  return <>
    <Button size="sm" variant="secondary" onClick={()=>setOpen(true)}>Create task</Button>
    <Dialog open={open} onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}} title="Confirm new task"
      description="Leave Sprint blank for the backlog. Select an assignee, priority and task details."
      footer={<>
        <Button variant="secondary" disabled={busy} onClick={guard.requestClose}>Cancel</Button>
        <Button disabled={busy||!valid} onClick={()=>void create()}>
          {busy?"Creating…":"Create task"}
        </Button>
      </>}>
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm font-semibold text-body">Sprint
          <select value={selectedSprintId} disabled={busy} onChange={event=>{
            setSelectedSprintId(event.target.value);setStatus("TODO");
          }} className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground">
            <option value="">Leave blank for the backlog</option>
            {choices.map(item=><option key={item.id} value={item.id}>
              {item.title} ({item.status.replaceAll("_"," ").toLowerCase()})
            </option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Task title
          <Input value={title} maxLength={200} required onChange={e=>setTitle(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Description
          <Textarea value={description} maxLength={4000} onChange={e=>setDescription(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Approach (optional)
          <Textarea value={approach} maxLength={4000} onChange={event=>setApproach(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Done when (optional)
          <Textarea value={criteria} maxLength={4000} onChange={e=>setCriteria(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Priority
          <select value={priority} onChange={e=>setPriority(e.target.value as typeof priority)}
            className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground">
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Status
          <select value={status} disabled={busy||!selectedSprintId}
            onChange={event=>setStatus(event.target.value as typeof status)}
            className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground">
            <option value="TODO">To Do</option>
            {chosenSprint?.status==="ACTIVE"?<>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BLOCKED">Blocked</option>
            </>:null}
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
        <label className="grid gap-1 text-sm font-semibold text-body">Assignee
          <select value={assigneeMembershipId} disabled={busy}
            onChange={event=>setAssigneeMembershipId(event.target.value)}
            className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground">
            <option value="">Unassigned</option>
            {learners.map(member=><option key={member.membershipId} value={member.membershipId}>
              {member.displayName??"Learner"}
            </option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Due date
          <Input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">What&apos;s blocking this task?
          <Textarea value={blockerReason} maxLength={4000}
            onChange={e=>setBlockerReason(e.target.value)}/>
        </label>
        {status==="BLOCKED"&&!blockerReason.trim()?<p role="alert" className="text-sm text-error">
          Explain what is blocking this task before creating it.
        </p>:null}
      </div>
    </Dialog>
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard task changes?"
      description="You have unsaved project changes. Leave this page and discard them?"
      confirmLabel="Discard changes" pending={busy}
      onConfirm={guard.confirmDiscard}/>
  </>;
}
