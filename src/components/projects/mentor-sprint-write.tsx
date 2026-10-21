"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";

/** Deliberate vNext granularity: each sprint mutation is a separate
 * version-checked transaction. A multi-sprint legacy Save plan is NOT atomic
 * in this UI; do not simulate one with parallel POST/PATCH calls. */
export const MENTOR_SPRINT_PLAN_SAVE_POLICY="PER_SPRINT_VERSIONED" as const;

export function MentorSprintCreate({
  projectId, releaseId,releases=[],
}: {projectId:string;releaseId:string;releases?:readonly {id:string;title:string;status:string}[]}) {
  const router=useRouter();
  const {showToast}=useToast();
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [goal,setGoal]=useState(""),[done,setDone]=useState("");
  const [startDate,setStartDate]=useState(""),[endDate,setEndDate]=useState(""),[dueDate,setDueDate]=useState("");
  const initialReleaseId=releases.find(item=>item.id===releaseId&&item.status!=="SHIPPED")?.id??
    releases.find(item=>item.status!=="SHIPPED")?.id??releaseId;
  const [chosenReleaseId,setChosenReleaseId]=useState(initialReleaseId);
  const chosenRelease=releases.find(item=>item.id===chosenReleaseId);
  const dirty=Boolean(title||description||goal||done||startDate||endDate||dueDate||chosenReleaseId!==initialReleaseId);
  function discardDraft(){
    setOpen(false);setTitle("");setDescription("");setGoal("");setDone("");
    setStartDate("");setEndDate("");setDueDate("");setChosenReleaseId(initialReleaseId);
  }
  const guard=useProjectEditorDiscardGuard(open,dirty,busy,discardDraft);
  const datesValid=(!startDate||!endDate||endDate>=startDate)&&
    (!dueDate||!startDate||dueDate>=startDate);
  async function create() {
    if(!title.trim() || title.trim().length>200 || description.length>4000||
      goal.length>4000||done.length>4000||!datesValid||!chosenReleaseId||
      chosenRelease?.status==="SHIPPED") return;
    setBusy(true);
    try {
      await projectMutation("/api/projects/"+projectId+"/sprints","POST",{
        releaseId:chosenReleaseId,title:title.trim(),description:description.trim()||null,
        goal:goal.trim()||null,definitionOfDone:done.trim()||null,
        startDate:startDate||null,endDate:endDate||null,dueDate:dueDate||null,
      });
      showToast({tone:"success",title:"Sprint created"});
      discardDraft();
      router.refresh();
    } catch {
      showToast({tone:"error",title:"Could not create sprint",
        description:"Please check the sprint details and try again."});
    } finally {setBusy(false);}
  }

  return <>
    <Button size="sm" variant="secondary" onClick={()=>setOpen(true)}>
      Add sprint
    </Button>
    <Dialog open={open} onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}} title="Create sprint"
      description="Create a planned sprint with goal, dates and definition of done in this release. Sprints are saved individually, not as one atomic plan."
      footer={<div className="flex w-full min-w-0 flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end">
        <Button className="w-full sm:w-auto" variant="secondary" disabled={busy} onClick={guard.requestClose}>Cancel</Button>
        <Button className="w-full sm:w-auto" loading={busy} disabled={busy||!title.trim()||title.trim().length>200||
          description.length>4000||!datesValid||!chosenReleaseId||
          chosenRelease?.status==="SHIPPED"} onClick={()=>void create()}>
          {busy?"Creating…":"Confirm create"}
        </Button>
      </div>}>
      <div className="grid min-w-0 gap-[var(--lms-space-4)]">
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Ships in release
          <Select value={chosenReleaseId} disabled={busy}
            onChange={event=>setChosenReleaseId(event.target.value)}
            className="min-h-11 w-full min-[768px]:min-h-9">
            {releases.some(release=>release.status!=="SHIPPED")?releases.filter(release=>release.status!=="SHIPPED").map(release=>
              <option key={release.id} value={release.id}>{release.title}</option>):
              <option value={releaseId}>Current release</option>}
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sprint title
          <Input maxLength={200} value={title}
            onChange={e=>setTitle(e.target.value)} required />
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Description
          <Textarea value={description} maxLength={4000}
            onChange={e=>setDescription(e.target.value)}
            placeholder="Optional description" />
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sprint goal
          <Textarea maxLength={4000} value={goal} onChange={e=>setGoal(e.target.value)}/></label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">What does done look like?
          <Textarea maxLength={4000} value={done} onChange={e=>setDone(e.target.value)}/></label>
        <div className="grid min-w-0 gap-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] min-[768px]:grid-cols-3">
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start date
            <Input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></label>
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">End date
            <Input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}/></label>
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Due date
            <Input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label>
        </div>
        {!datesValid?<p role="alert" className="text-sm font-semibold text-error">
          Sprint end and due dates must not come before the start date.
        </p>:null}
      </div>
    </Dialog>
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard sprint changes?"
      description="You have unsaved project changes. Leave this page and discard them?"
      confirmLabel="Discard changes" pending={busy}
      onConfirm={guard.confirmDiscard}/>
  </>;
}

export function MentorSprintTransition({
  projectId,sprintId,status,releaseStatus,updatedAt,
}:{
  projectId:string;sprintId:string;status:string;
  releaseStatus:string;updatedAt:string;
}) {
  const router=useRouter();
  const {showToast}=useToast();
  const [busy,setBusy]=useState(false);
  const [confirming,setConfirming]=useState(false);
  const action=status==="PLANNED"?"START":
    status==="ACTIVE"?"COMPLETE":
    status==="COMPLETED"&&releaseStatus!=="SHIPPED"?"REOPEN":null;
  if(!action) return null;

  const label=action==="START"?"Start sprint":
    action==="COMPLETE"?"Complete sprint":"Reopen sprint";
  async function transition() {
    if(!action) return;
    setConfirming(false);
    setBusy(true);
    try {
      await projectMutation("/api/projects/"+projectId+"/sprints/"+sprintId+
        "/mentor-transition","POST",{action,expectedUpdatedAt:updatedAt});
      showToast({tone:"success",title:action==="COMPLETE"?"Sprint completed. Anything not done went back to the backlog.":action==="START"?"Sprint started.":"Sprint reopened."});
      router.refresh();
    } catch {
      showToast({tone:"error",title:"Sprint status was not changed",
        description:"Reload the sprint to review its latest status, then try again."});
    } finally {setBusy(false);}
  }
  return <>
    <Button size="sm" variant="secondary" loading={busy} disabled={busy} onClick={()=>setConfirming(true)}>
      {busy?"Saving…":label}
    </Button>
    <ConfirmDialog open={confirming} onOpenChange={setConfirming}
      title={label+"?"}
      description="The sprint status and project activity will change."
      confirmLabel={label} pending={busy} onConfirm={transition}/>
  </>;
}
