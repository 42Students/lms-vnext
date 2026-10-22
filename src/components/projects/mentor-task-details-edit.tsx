"use client";

import { type FormEvent, useId, useState } from "react";
import { Select } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";
import { FriendlyFetchError } from "@/lib/api-fetch";
import { friendlyApiError } from "@/lib/friendly-error";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";

type Props={
  projectId:string;taskId:string;title:string;description:string|null;
  /** Old admin-style repeating rows edit inline; detail pages keep the dialog. */
  inlineEdit?:boolean;
  approach:string|null;
  acceptanceCriteria:string|null;priority:string;updatedAt:string;
  taskType:string|null;estimatePoints:number|null;dueDate:string|null;blockerReason:string|null;
};
export function MentorTaskDetailsEdit(props:Props) {
  const router=useRouter();
  const estimateErrorId=useId();
  const {showToast}=useToast();
  const [open,setOpen]=useState(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [title,setTitle]=useState(props.title);
  const [description,setDescription]=useState(props.description??"");
  const [approach,setApproach]=useState(props.approach??"");
  const [criteria,setCriteria]=useState(props.acceptanceCriteria??"");
  const [priority,setPriority]=useState(props.priority);
  const [taskType,setTaskType]=useState(props.taskType??"");
  const [estimate,setEstimate]=useState(props.estimatePoints?.toString()??"");
  const [dueDate,setDueDate]=useState(props.dueDate??"");
  const [blockerReason,setBlockerReason]=useState(props.blockerReason??"");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const estimateValid=estimate===""||
    (Number.isInteger(Number(estimate))&&Number(estimate)>=0&&Number(estimate)<=1000);
  const changed=title.trim()!==props.title ||
    (description.trim()||null)!==(props.description??null) ||
    (approach.trim()||null)!==(props.approach??null) ||
    (criteria.trim()||null)!==(props.acceptanceCriteria??null) ||
    priority!==props.priority || taskType!==(props.taskType??"") ||
    estimate!==(props.estimatePoints?.toString()??"") || dueDate!==(props.dueDate??"") ||
    blockerReason.trim()!==(props.blockerReason??"");
  function discardDraft(){setOpen(false);setConfirmOpen(false);setError(null);}
  const guard=useProjectEditorDiscardGuard(open||confirmOpen,changed,pending,discardDraft);
  function begin() {
    setTitle(props.title);
    setDescription(props.description??"");
    setApproach(props.approach??"");
    setCriteria(props.acceptanceCriteria??"");
    setPriority(props.priority);
    setTaskType(props.taskType??"");setEstimate(props.estimatePoints?.toString()??"");
    setDueDate(props.dueDate??"");setBlockerReason(props.blockerReason??"");
    setError(null);setOpen(true);
  }
  function review(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!title.trim()||title.trim().length>200||
      description.trim().length>4000||approach.trim().length>4000||
      criteria.trim().length>4000||blockerReason.trim().length>4000||
      !estimateValid||!changed) {
      setError("Change a task field within its allowed length.");
      return;
    }
    setOpen(false);setConfirmOpen(true);setError(null);
  }
  async function save() {
    setPending(true);setError(null);
    try {
      await projectMutation(
        "/api/projects/"+encodeURIComponent(props.projectId)+
          "/tasks/"+encodeURIComponent(props.taskId)+"/details",
        "PATCH",{
          title:title.trim(),description:description.trim()||null,
          approach:approach.trim()||null,
          acceptanceCriteria:criteria.trim()||null,
          priority,expectedUpdatedAt:props.updatedAt,
          taskType:taskType||null,estimatePoints:estimate!==""?Number(estimate):null,
          dueDate:dueDate||null,blockerReason:blockerReason.trim()||null,
        },
      );
      setConfirmOpen(false);
      showToast({tone:"success",title:"Task updated."});
      router.refresh();
    } catch(caught) {
      const message=caught instanceof FriendlyFetchError?caught.message:friendlyApiError({});
      setError(message);
      showToast({tone:"error",title:"Task update failed",description:message});
    } finally {setPending(false);}
  }
  const editor=(
      <form onSubmit={review} className="grid gap-4">
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title
          <Input required maxLength={200} value={title}
            onChange={event=>setTitle(event.target.value)} />
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Description
          <Textarea maxLength={4000} value={description}
            onChange={event=>setDescription(event.target.value)} />
        </label>
        <details className="min-w-0 border-y border-[var(--lms-canvas-border)] py-[var(--lms-space-3)]">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-[13px] font-semibold leading-5 text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Approach and done criteria</summary>
          <div className="mt-[var(--lms-space-3)] grid min-w-0 gap-[var(--lms-space-3)]">
            <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Approach (optional)
              <Textarea maxLength={4000} value={approach} onChange={event=>setApproach(event.target.value)}/>
            </label>
            <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Done when (optional)
              <Textarea maxLength={4000} value={criteria} onChange={event=>setCriteria(event.target.value)}/>
            </label>
          </div>
        </details>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Priority
          <Select value={priority} onChange={event=>setPriority(event.target.value)}
            className="min-h-11 w-full min-[768px]:min-h-9">
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Estimate
          <Input type="number" min={0} max={1000} value={estimate}
            aria-invalid={!estimateValid} aria-describedby={!estimateValid?estimateErrorId:undefined}
            onChange={e=>setEstimate(e.target.value)}/>
        </label>
        {!estimateValid?<p id={estimateErrorId} role="alert" className="text-xs text-error">
          Estimate must be a whole number from 0 to 1000.
        </p>:null}
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Type
          <Select className="min-h-11 w-full min-[768px]:min-h-9" value={taskType}
            onChange={e=>setTaskType(e.target.value)}>
            <option value="">Not specified</option><option value="STORY">Story</option>
            <option value="BUG">Bug</option><option value="CHORE">Chore</option>
            <option value="SPIKE">Spike</option>
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Due
          <Input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Blocker note
          <Textarea maxLength={4000} value={blockerReason}
            onChange={e=>setBlockerReason(e.target.value)}/>
        </label>
        {error?<p role="alert" className="text-sm font-semibold text-error">{error}</p>:null}
        <div className="flex flex-col-reverse gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={guard.requestClose}>Cancel</Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={!changed||!title.trim()||!estimateValid}>
            Review changes
          </Button>
        </div>
      </form>
  );
  return <>
    {(!props.inlineEdit||!open)?
      <Button size="sm" variant="secondary" aria-haspopup={props.inlineEdit?undefined:"dialog"} onClick={begin}
        aria-expanded={props.inlineEdit?open:undefined}>
        {props.inlineEdit?"Edit row":"Edit task"}
      </Button>:null}
    {props.inlineEdit
      ? open?<section aria-label={"Edit task "+props.title}
          className="mt-2 min-w-0 rounded border border-border bg-surface p-3">
          <h3 className="mb-3 text-sm font-semibold">Edit task · {props.title}</h3>
          {editor}
        </section>:null
      : <Dialog open={open} onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}} title="Edit task details"
      description="Change registered task details. Status, assignee and sprint remain unchanged.">
      {editor}
    </Dialog>}
    <ConfirmDialog open={confirmOpen} onOpenChange={next=>{setConfirmOpen(next);if(!next&&!pending)setOpen(true);}}
      title="Confirm task changes?"
      description="Updated details will be visible to the assigned project team."
      confirmLabel="Save changes" confirmVariant="primary"
      pending={pending} onConfirm={save}>
      <dl className="grid min-w-0 gap-[var(--lms-space-2)] border-y border-[var(--lms-canvas-border)] py-[var(--lms-space-3)] text-sm leading-5 text-body">
        <dt className="font-semibold text-foreground">Title</dt>
        <dd className="break-words">{title.trim()}</dd>
        <dt className="font-semibold text-foreground">Priority</dt>
        <dd>{priority}</dd>
        <dt className="font-semibold text-foreground">Description</dt>
        <dd className="break-words">{description.trim()||"Not provided"}</dd>
        <dt className="font-semibold text-foreground">Approach</dt>
        <dd className="break-words">{approach.trim()||"Not provided"}</dd>
        <dt className="font-semibold text-foreground">Acceptance criteria</dt>
        <dd className="break-words">{criteria.trim()||"Not provided"}</dd>
        <dt className="font-semibold text-foreground">Estimate · Type · Due</dt>
        <dd className="break-words">{estimate||"Not set"} · {taskType||"Not specified"} · {dueDate||"Not set"}</dd>
        <dt className="font-semibold text-foreground">Blocker note</dt>
        <dd className="break-words">{blockerReason.trim()||"Not provided"}</dd>
      </dl>
      {error?<p role="alert" className="mt-3 text-sm text-error">{error}</p>:null}
    </ConfirmDialog>
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard task changes?"
      description="You have unsaved project changes. Leave this page and discard them?"
      confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
  </>;
}
