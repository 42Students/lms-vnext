"use client";

import {useState} from "react";
import { Select } from "@/components/ui/select";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";
import {mentorEstimateLabel,mentorEstimateOptions} from "@/modules/projects/mentor-estimation-unit-model";

export function MentorTaskCreate({
  projectId,sprintId,updatedAt,estimationUnit,sprints=[],learners=[],primary=false,
}:{projectId:string;sprintId:string;updatedAt:string;estimationUnit?:string|null;
  sprints?:readonly {id:string;title:string;status:string;updatedAt:string}[];
  learners?:readonly {membershipId:string;displayName:string|null}[];
  primary?:boolean;
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
      discardDraft();
      router.refresh();
    }catch{
      showToast({tone:"error",title:"Task was not created",
        description:"Check the task details and try again."});
    }finally{setBusy(false);}
  }
  return <>
    <Button size="sm" variant={primary?"primary":"secondary"} onClick={()=>setOpen(true)}>Create task</Button>
    <Dialog open={open} onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}} title="Confirm new task"
      description="Leave Sprint blank for the backlog. Select an assignee, priority and task details."
      footer={<div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end">
        <Button className="w-full sm:w-auto" variant="secondary" disabled={busy} onClick={guard.requestClose}>Cancel</Button>
        <Button className="w-full sm:w-auto" loading={busy} disabled={busy||!valid} onClick={()=>void create()}>
          {busy?"Creating…":"Create task"}
        </Button>
      </div>}>
      <div className="grid gap-4">
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sprint
          <Select value={selectedSprintId} disabled={busy} onChange={event=>{
            setSelectedSprintId(event.target.value);setStatus("TODO");
          }} className="min-h-11 w-full min-[768px]:min-h-9">
            <option value="">Leave blank for the backlog</option>
            {choices.map(item=><option key={item.id} value={item.id}>
              {item.title} ({item.status.replaceAll("_"," ").toLowerCase()})
            </option>)}
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Task title
          <Input value={title} maxLength={200} required onChange={e=>setTitle(e.target.value)} />
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Description
          <Textarea value={description} maxLength={4000} onChange={e=>setDescription(e.target.value)} />
        </label>
        <details className="min-w-0 border-y border-[var(--lms-canvas-border)] py-[var(--lms-space-3)]" open={Boolean(approach||criteria)||undefined}>
          <summary className="min-h-11 w-fit cursor-pointer text-[13px] font-semibold leading-5 text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)]">Approach and done criteria</summary>
          <div className="mt-[var(--lms-space-3)] grid min-w-0 gap-[var(--lms-space-3)]">
            <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Approach (optional)
              <Textarea value={approach} maxLength={4000} onChange={event=>setApproach(event.target.value)} />
            </label>
            <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Done when (optional)
              <Textarea value={criteria} maxLength={4000} onChange={e=>setCriteria(e.target.value)} />
            </label>
          </div>
        </details>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Priority
          <Select value={priority} onChange={e=>setPriority(e.target.value as typeof priority)}
            className="min-h-11 w-full min-[768px]:min-h-9">
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
          <Select value={status} disabled={busy||!selectedSprintId}
            onChange={event=>setStatus(event.target.value as typeof status)}
            className="min-h-11 w-full min-[768px]:min-h-9">
            <option value="TODO">To Do</option>
            {chosenSprint?.status==="ACTIVE"?<>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BLOCKED">Blocked</option>
            </>:null}
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Estimate ({mentorEstimateLabel(1,estimationUnit).replace(/^1 /,"")})
          <Select value={estimate} onChange={e=>setEstimate(e.target.value)}
            className="min-h-11 w-full min-[768px]:min-h-9">
            <option value="">Not estimated</option>
            {mentorEstimateOptions(estimationUnit).map(value=>
              <option key={value} value={String(value)}>{mentorEstimateLabel(value,estimationUnit)}</option>)}
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Type
          <Select value={taskType} onChange={e=>setTaskType(e.target.value)}
            className="min-h-11 w-full min-[768px]:min-h-9">
            <option value="">Not specified</option><option value="STORY">Story</option>
            <option value="BUG">Bug</option><option value="CHORE">Chore</option>
            <option value="SPIKE">Spike</option>
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Assignee
          <Select value={assigneeMembershipId} disabled={busy}
            onChange={event=>setAssigneeMembershipId(event.target.value)}
            className="min-h-11 w-full min-[768px]:min-h-9">
            <option value="">Unassigned</option>
            {learners.map(member=><option key={member.membershipId} value={member.membershipId}>
              {member.displayName??"Learner"}
            </option>)}
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Due date
          <Input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">What&apos;s blocking this task?
          <Textarea value={blockerReason} maxLength={4000}
            onChange={e=>setBlockerReason(e.target.value)}/>
        </label>
        {status==="BLOCKED"&&!blockerReason.trim()?<p role="alert" className="text-[13px] leading-5 text-[var(--lms-error-text)]">
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
