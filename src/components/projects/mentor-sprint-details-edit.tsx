"use client";

import { type FormEvent, useEffect, useState } from "react";
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
import { useProjectEditorDiscardGuard } from "./project-editor-discard-guard";

export function MentorSprintDetailsEdit({
  projectId,sprintId,title:originalTitle,
  description:originalDescription,updatedAt,goal:originalGoal,definitionOfDone:originalDone,
  startDate:originalStart,endDate:originalEnd,dueDate:originalDue,status,estimationUnit,
  dueLabel:originalDueLabel=null,sprintKey=null,releaseTitle=null,
}:{
  projectId:string;sprintId:string;title:string;
  description:string|null;updatedAt:string;
  goal:string|null;definitionOfDone:string|null;startDate:string|null;endDate:string|null;
  dueDate:string|null;status:string;estimationUnit?:string|null;
  dueLabel?:string|null;sprintKey?:string|null;releaseTitle?:string|null;
}) {
  const router=useRouter();
  const {showToast}=useToast();
  const [open,setOpen]=useState(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [title,setTitle]=useState(originalTitle);
  const [dueLabel,setDueLabel]=useState(originalDueLabel??"");
  const [description,setDescription]=useState(originalDescription??"");
  const [goal,setGoal]=useState(originalGoal??""),[done,setDone]=useState(originalDone??"");
  const [start,setStart]=useState(originalStart??""),[end,setEnd]=useState(originalEnd??""),
    [due,setDue]=useState(originalDue??"");
  const [pending,setPending]=useState(false);
  const [lastLoadedVersion,setLastLoadedVersion]=useState(updatedAt);
  const [error,setError]=useState<string|null>(null);
  const changed=title.trim()!==originalTitle||
    (dueLabel.trim()||null)!==(originalDueLabel??null)||
    (description.trim()||null)!==(originalDescription??null)||
    (goal.trim()||null)!==(originalGoal??null)||(done.trim()||null)!==(originalDone??null)||
    (start||null)!==originalStart||(end||null)!==originalEnd||(due||null)!==originalDue;
  function discardDraft() {
    setOpen(false);
    setConfirmOpen(false);
    setError(null);
    setTitle(originalTitle);setDueLabel(originalDueLabel??"");
    setDescription(originalDescription??"");
    setGoal(originalGoal??"");setDone(originalDone??"");
    setStart(originalStart??"");setEnd(originalEnd??"");setDue(originalDue??"");
  }
  const guard=useProjectEditorDiscardGuard(open||confirmOpen,changed,pending,discardDraft);
  // A server refresh can replace the sprint while the same component instance
  // remains mounted. Only reseed a closed editor: an open draft must not be
  // silently overwritten by the refreshed row.
  useEffect(()=>{
    if(lastLoadedVersion===updatedAt||open||confirmOpen)return;
    setTitle(originalTitle);setDueLabel(originalDueLabel??"");
    setDescription(originalDescription??"");
    setGoal(originalGoal??"");setDone(originalDone??"");
    setStart(originalStart??"");setEnd(originalEnd??"");setDue(originalDue??"");
    setError(null);setLastLoadedVersion(updatedAt);
  },[updatedAt,lastLoadedVersion,open,confirmOpen,
    originalTitle,originalDueLabel,originalDescription,originalGoal,originalDone,
    originalStart,originalEnd,originalDue]);
  function begin() {
    setTitle(originalTitle);setDueLabel(originalDueLabel??"");
    setDescription(originalDescription??"");
    setGoal(originalGoal??"");setDone(originalDone??"");
    setStart(originalStart??"");setEnd(originalEnd??"");setDue(originalDue??"");
    setError(null);
    setOpen(true);
  }
  function review(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(lastLoadedVersion!==updatedAt){
      setError("This sprint changed since editing began. Close the editor and review the latest version.");
      return;
    }
    if(!changed){showToast({tone:"info",title:"No changes to save"});return;}
    if(!title.trim()){setError("Item 1: Title required");return;}
    if(title.trim().length>200){setError("Item 1: Title must be 200 characters or fewer");return;}
    if(dueLabel.trim().length>160){setError("Due label must be 160 characters or fewer");return;}
    if(description.trim().length>4000||goal.length>4000||done.length>4000){
      setError("Sprint description and goal must be 4000 characters or fewer");return;
    }
    if(start&&end&&end<start){setError("End date must follow start date");return;}
    setError(null);
    setOpen(false);
    setConfirmOpen(true);
  }
  async function save() {
    setPending(true);
    setError(null);
    try {
      await projectMutation(
        "/api/projects/"+encodeURIComponent(projectId)+
        "/sprints/"+encodeURIComponent(sprintId),
        "PATCH",
        {
          title:title.trim(),dueLabel:dueLabel.trim()||null,
          description:description.trim()||null,
          goal:goal.trim()||null,definitionOfDone:done.trim()||null,
          startDate:start||null,endDate:end||null,dueDate:due||null,
          expectedUpdatedAt:updatedAt,
        },
      );
      setConfirmOpen(false);
      showToast({tone:"success",title:"Sprints updated"});
      router.refresh();
    } catch(caught) {
      const message=caught instanceof FriendlyFetchError?caught.message:friendlyApiError({});
      setError(message);
      showToast({tone:"error",title:"Failed to update sprints",description:message});
    } finally {
      setPending(false);
    }
  }
  return <>
    <Button size="sm" variant="secondary" onClick={begin}>Edit sprint</Button>
    <Dialog open={open} onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}} title="Edit sprint details"
      description="Edit sprint goals and dates. Dates are locked once a sprint is active.">
      <form onSubmit={review} className="grid min-w-0 gap-[var(--lms-space-4)]">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Sprint title
            <Input required maxLength={200} value={title} placeholder="e.g. Kickoff & planning"
              onChange={event=>setTitle(event.target.value)} />
          </label>
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Due label
            <Input value={dueLabel} maxLength={160} placeholder="e.g. Week 2"
              onChange={event=>setDueLabel(event.target.value)}/>
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-[13px] font-semibold text-body">
            Sprint key
            <Input value={sprintKey??""} disabled aria-label="Stable sprint key"/>
          </label>
          <label className="grid gap-1 text-[13px] font-semibold text-body">
            Linked release
            <Input value={releaseTitle??"Release"} disabled/>
          </label>
        </div>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Sprint description (optional)
          <Textarea maxLength={4000} value={description}
            onChange={event=>setDescription(event.target.value)} />
        </label>
        {estimationUnit?<p className="m-0 text-xs text-muted-foreground">Project estimation unit: {estimationUnit==="HOURS"?"Hours":estimationUnit==="POINTS"?"Points":estimationUnit}</p>:null}
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sprint goal
          <Textarea maxLength={4000} placeholder="One sentence: what this sprint is trying to achieve." value={goal} onChange={e=>setGoal(e.target.value)}/></label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">What does done look like?
          <Textarea maxLength={4000} placeholder="List acceptance criteria for this sprint."
            value={done} onChange={e=>setDone(e.target.value)}/></label>
        
        <div className="grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-3">
          {([{label:"Start Date",value:start,set:setStart},
             {label:"End date",value:end,set:setEnd},
             {label:"Due date",value:due,set:setDue}]).map(row=>
              <label key={row.label} className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{row.label}
                <Input type="date" value={row.value} disabled={status==="ACTIVE"}
                  onChange={e=>row.set(e.target.value)}/></label>)}
        </div>
        {error?<p role="alert" className="text-sm font-semibold text-error">{error}</p>:null}
        <div className="flex min-w-0 flex-col-reverse gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] md:flex-row md:justify-end">
          <Button className="w-full md:w-auto" type="button" variant="secondary" onClick={guard.requestClose}>
            Cancel
          </Button>
          <Button className="w-full md:w-auto" type="submit" disabled={!changed||!title.trim()}>
            Review changes
          </Button>
        </div>
      </form>
    </Dialog>
    <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!next)guard.requestClose();}}
      title="Confirm sprint changes?"
      description="The revised sprint details will be visible to its project team."
      confirmLabel="Save sprint details" confirmVariant="primary"
      pending={pending} onConfirm={save}>
      <dl className="grid min-w-0 gap-[var(--lms-space-2)] border-y border-[var(--lms-canvas-border)] py-[var(--lms-space-3)] text-[var(--lms-font-base)] leading-5 text-[var(--lms-body-text)]">
        <dt className="font-semibold text-foreground">Title</dt>
        <dd className="break-words">{title.trim()}</dd>
        <dt className="font-semibold text-foreground">Description</dt>
        <dd className="break-words">{description.trim()||"No description"}</dd>
        <dt className="font-semibold text-foreground">Sprint goal</dt>
        <dd className="break-words">{goal.trim()||"Not provided"}</dd>
        <dt className="font-semibold text-foreground">What does done look like?</dt>
        <dd className="break-words">{done.trim()||"Not provided"}</dd>
        <dt className="font-semibold text-foreground">Start date · End date · Due date</dt>
        <dd className="break-words">{start||"Not set"} · {end||"Not set"} · {due||"Not set"}</dd>
      </dl>
      {error?<p role="alert" className="mt-3 text-sm font-semibold text-error">{error}</p>:null}
    </ConfirmDialog>
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard sprint changes?"
      description="You have unsaved changes. Leave without saving them?"
      confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
  </>;
}
