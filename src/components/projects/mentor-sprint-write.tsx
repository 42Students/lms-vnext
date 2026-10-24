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
import {mentorSprintDefaultReleaseId} from "@/modules/projects/mentor-sprint-order-model";
import {mentorSprintPlanningDefaults,type MentorSprintPlanningRow} from "@/modules/projects/mentor-sprint-planning-defaults-model";
import {MentorSprintBacklogPull,type MentorSprintBacklogChoice} from "./mentor-sprint-backlog-pull";

/** Deliberate vNext granularity: each sprint mutation is a separate
 * version-checked transaction. A multi-sprint legacy Save plan is NOT atomic
 * in this UI; do not simulate one with parallel POST/PATCH calls. */
export const MENTOR_SPRINT_PLAN_SAVE_POLICY="PER_SPRINT_VERSIONED" as const;

export function MentorSprintCreate({
  projectId, releaseId,releases=[],sprintPlan=[],backlogTasks=[],canPullBacklog=false,inline=false,
}: {projectId:string;releaseId:string;releases?:readonly {id:string;title:string;status:string}[];
 sprintPlan?:readonly MentorSprintPlanningRow[];
 backlogTasks?:readonly MentorSprintBacklogChoice[];canPullBacklog?:boolean;
 inline?:boolean}) {
  const router=useRouter();
  const {showToast}=useToast();
  const [open,setOpen]=useState(false);
  const [justCreated,setJustCreated]=useState<{id:string;title:string}|null>(null);
  const [busy,setBusy]=useState(false);
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [key,setKey]=useState(""),[dueLabel,setDueLabel]=useState("");
  const [goal,setGoal]=useState(""),[done,setDone]=useState("");
  const [startDate,setStartDate]=useState(""),[endDate,setEndDate]=useState(""),[dueDate,setDueDate]=useState("");
  // A contextual "Add sprint" button must preselect its own release even when
  // this project has several releases; the server still validates its scope.
  const initialReleaseId=mentorSprintDefaultReleaseId(releaseId,releases);
  const [chosenReleaseId,setChosenReleaseId]=useState(initialReleaseId);
  const chosenRelease=releases.find(item=>item.id===chosenReleaseId);
  const suggested=mentorSprintPlanningDefaults(chosenReleaseId,sprintPlan);
  const sprintKeyPreview=title.trim().toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,64);
  const dirty=Boolean(title||key||dueLabel||description||goal||done||startDate||endDate||dueDate||chosenReleaseId!==initialReleaseId);
  function discardDraft(){
    setOpen(false);setTitle("");setKey("");setDueLabel("");setDescription("");setGoal("");setDone("");
    setStartDate("");setEndDate("");setDueDate("");setChosenReleaseId(initialReleaseId);
  }
  const guard=useProjectEditorDiscardGuard(open,dirty,busy,discardDraft);
  function beginCreate(){
    if(!open){const proposal=mentorSprintPlanningDefaults(initialReleaseId,sprintPlan);
      setChosenReleaseId(initialReleaseId);setTitle(proposal.title);
      setStartDate(proposal.startDate);setEndDate(proposal.endDate);
    }
    setOpen(true);
  }
  const datesValid=(!startDate||!endDate||endDate>=startDate)&&
    (!dueDate||!startDate||dueDate>=startDate);
  async function create() {
    if(!title.trim() || title.trim().length>200 || key.length>120 ||
      dueLabel.length>160 || description.length>4000||
      goal.length>4000||done.length>4000||!datesValid||!chosenReleaseId||
      chosenRelease?.status==="SHIPPED") return;
    setBusy(true);
    try {
      const receipt=await projectMutation("/api/projects/"+projectId+"/sprints","POST",{
        releaseId:chosenReleaseId,title:title.trim(),key:key.trim(),
        dueLabel:dueLabel.trim()||null,description:description.trim()||null,
        goal:goal.trim()||null,definitionOfDone:done.trim()||null,
        startDate:startDate||null,endDate:endDate||null,dueDate:dueDate||null,
      }) as {sprint?:{id:string;title:string}};
      if(!receipt.sprint?.id)throw Error("Sprint creation result could not be verified. Reload the project before trying again.");
      setJustCreated({id:receipt.sprint.id,title:receipt.sprint.title});
      showToast({tone:"success",title:"Sprint created",description:
        "Sprint saved. Pull backlog tasks individually below or use the Board."});
      discardDraft();
      router.refresh();
    } catch {
      showToast({tone:"error",title:"Could not create sprint",
        description:"Please check the sprint details and try again."});
    } finally {setBusy(false);}
  }

  const sprintActions=<div className="flex w-full min-w-0 flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end">
        <Button className="w-full sm:w-auto" variant="secondary" disabled={busy} onClick={guard.requestClose}>Cancel</Button>
        <Button className="w-full sm:w-auto" loading={busy} disabled={busy||!title.trim()||title.trim().length>200||
          key.length>120||dueLabel.length>160||description.length>4000||
          !datesValid||!chosenReleaseId||
          chosenRelease?.status==="SHIPPED"} onClick={()=>void create()}>
          {busy?"Creating…":"Confirm create"}
        </Button>
      </div>;
  const sprintForm=(<div className="grid min-w-0 gap-[var(--lms-space-4)]">
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Release
          <Select value={chosenReleaseId} disabled={busy} required aria-invalid={!chosenReleaseId}
            onChange={event=>{
              const choice=event.target.value;
              const proposal=mentorSprintPlanningDefaults(choice,sprintPlan);
              setChosenReleaseId(choice);setTitle(proposal.title);
              setStartDate(proposal.startDate);setEndDate(proposal.endDate);
            }}
            className="min-h-11 w-full min-[768px]:min-h-9">
            <option value="" disabled>Pick the release this sprint ships in</option>
            {releases.filter(release=>release.status!=="SHIPPED").map(release=>
              <option key={release.id} value={release.id}>{release.title}</option>)}
          </Select>
        </label>
        {!chosenReleaseId?<p role="alert" className="text-xs text-error">Select a release before saving.</p>:null}
        {chosenReleaseId?<p className="text-xs text-muted-foreground">
          Suggested {suggested.title} in this release.
          {suggested.startDate?" Proposed weekly dates follow the last recorded sprint end.":" No reliable previous sprint end date; choose dates explicitly."}
          These are editable defaults; the server assigns the final sequence.
        </p>:null}
        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Key (optional)
            <Input maxLength={120} placeholder="Auto-generated from title if left blank"
              value={key} onChange={e=>setKey(e.target.value)}/>
          </label>
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Due (optional)
            <Input maxLength={160} placeholder="e.g. Week 2"
              value={dueLabel} onChange={e=>setDueLabel(e.target.value)}/>
          </label>
        </div>
        {!key.trim()&&title.trim()?<p className="text-xs text-muted-foreground">
          Will be saved as: {sprintKeyPreview||"sprint"}
        </p>:null}
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title
          <Input maxLength={200} placeholder="e.g. Kickoff & planning" aria-invalid={!title.trim()}
            value={title} onChange={e=>setTitle(e.target.value)} required />
          {!title.trim()?<span role="alert" className="text-xs text-error">Title is required</span>:null}
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Description
          <Textarea value={description} maxLength={4000}
            onChange={e=>setDescription(e.target.value)}
            placeholder="Optional description" />
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sprint goal (optional)
          <Input maxLength={4000} value={goal} onChange={e=>setGoal(e.target.value)}
            placeholder="One sentence: what this sprint is trying to achieve"/></label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">What does done look like?
          <Textarea maxLength={4000} value={done} onChange={e=>setDone(e.target.value)}
            placeholder="Acceptance criteria — e.g. API returns paginated results and integration tests pass"/></label>
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
      </div>);
  return <>
    <Button size="sm" variant="secondary" onClick={beginCreate} className="min-h-11 md:min-h-9">
      Add sprint
    </Button>
    {inline ? (open ? <section aria-label="Create sprint"
      className="mt-3 min-w-0 space-y-4 border-y border-[var(--lms-canvas-border)] py-4">
      <h4 className="text-base font-semibold text-foreground">Create sprint</h4>
      <p className="text-sm text-body">
        Choose a release and enter an outcome-focused sprint plan.
      </p>
      {sprintForm}
      {sprintActions}
      <p className="text-xs text-body">Only this workspace’s sprint plan is updated.</p>
    </section> : null) :
      <Dialog open={open} onOpenChange={next=>{if(next)beginCreate();else guard.requestClose();}}
        title="Create sprint"
        description="Add a sprint to your plan. Its title is kept when its generated key is assigned. Individual sprints save separately so other planned work is not overwritten."
        footer={sprintActions}>
        {sprintForm}
      </Dialog>}
    {justCreated?<MentorSprintBacklogPull key={justCreated.id}
      projectId={projectId} sprintId={justCreated.id}
      sprintTitle={justCreated.title} tasks={backlogTasks}
      canPull={canPullBacklog}/>:null}
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
