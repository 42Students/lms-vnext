"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";
import { useProjectEditorDiscardGuard } from "./project-editor-discard-guard";

export function MentorSprintDetailsEdit({
  projectId,sprintId,title:originalTitle,
  description:originalDescription,updatedAt,goal:originalGoal,definitionOfDone:originalDone,
  startDate:originalStart,endDate:originalEnd,dueDate:originalDue,status,estimationUnit,
}:{
  projectId:string;sprintId:string;title:string;
  description:string|null;updatedAt:string;
  goal:string|null;definitionOfDone:string|null;startDate:string|null;endDate:string|null;
  dueDate:string|null;status:string;estimationUnit?:string|null;
}) {
  const router=useRouter();
  const {showToast}=useToast();
  const [open,setOpen]=useState(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [title,setTitle]=useState(originalTitle);
  const [description,setDescription]=useState(originalDescription??"");
  const [goal,setGoal]=useState(originalGoal??""),[done,setDone]=useState(originalDone??"");
  const [start,setStart]=useState(originalStart??""),[end,setEnd]=useState(originalEnd??""),
    [due,setDue]=useState(originalDue??"");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const changed=title.trim()!==originalTitle ||
    (description.trim()||null)!==(originalDescription??null)||
    (goal.trim()||null)!==(originalGoal??null)||(done.trim()||null)!==(originalDone??null)||
    (start||null)!==originalStart||(end||null)!==originalEnd||(due||null)!==originalDue;
  function discardDraft() {
    setOpen(false);
    setConfirmOpen(false);
    setError(null);
    setTitle(originalTitle);
    setDescription(originalDescription??"");
    setGoal(originalGoal??"");setDone(originalDone??"");
    setStart(originalStart??"");setEnd(originalEnd??"");setDue(originalDue??"");
  }
  const guard=useProjectEditorDiscardGuard(open||confirmOpen,changed,pending,discardDraft);
  function begin() {
    setTitle(originalTitle);
    setDescription(originalDescription??"");
    setGoal(originalGoal??"");setDone(originalDone??"");
    setStart(originalStart??"");setEnd(originalEnd??"");setDue(originalDue??"");
    setError(null);
    setOpen(true);
  }
  function review(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!title.trim()||title.trim().length>200||description.trim().length>4000||goal.length>4000||done.length>4000||
      (start&&end&&end<start)||!changed) {
      setError("Enter changed sprint details within the field limits.");
      return;
    }
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
          title:title.trim(),description:description.trim()||null,
          goal:goal.trim()||null,definitionOfDone:done.trim()||null,
          startDate:start||null,endDate:end||null,dueDate:due||null,
          expectedUpdatedAt:updatedAt,
        },
      );
      setConfirmOpen(false);
      showToast({tone:"success",title:"Sprint details updated"});
      router.refresh();
    } catch(caught) {
      const message=caught instanceof Error?caught.message:"Could not update sprint details.";
      setError(message);
      showToast({tone:"error",title:"Sprint update failed",description:message});
    } finally {
      setPending(false);
    }
  }
  return <>
    <Button size="sm" variant="secondary" onClick={begin}>Edit sprint</Button>
    <Dialog open={open} onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}} title="Edit sprint details"
      description="Edit sprint goals and dates. Dates are locked once a sprint is active.">
      <form onSubmit={review} className="grid gap-4">
        <label className="grid gap-1 text-xs font-semibold text-body">
          Sprint title
          <Input required maxLength={200} value={title}
            onChange={event=>setTitle(event.target.value)} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-body">
          Sprint description (optional)
          <Textarea maxLength={4000} value={description}
            onChange={event=>setDescription(event.target.value)} />
        </label>
        {estimationUnit?<p className="m-0 text-xs text-muted-foreground">Project estimation unit: {estimationUnit==="HOURS"?"Hours":estimationUnit==="POINTS"?"Points":estimationUnit}</p>:null}
        <label className="grid gap-1 text-xs font-semibold text-body">Sprint goal
          <Textarea maxLength={4000} value={goal} onChange={e=>setGoal(e.target.value)}/></label>
        <label className="grid gap-1 text-xs font-semibold text-body">What does done look like?
          <Textarea maxLength={4000} value={done} onChange={e=>setDone(e.target.value)}/></label>
        {estimationUnit ? <p className="m-0 text-xs text-body">
          Project estimation unit: {estimationUnit==="HOURS"?"Hours":estimationUnit==="POINTS"?"Points":estimationUnit}
        </p> : null}
        <div className="grid gap-3 sm:grid-cols-3">
          {([{label:"Start date",value:start,set:setStart},
             {label:"End date",value:end,set:setEnd},
             {label:"Due date",value:due,set:setDue}]).map(row=>
              <label key={row.label} className="text-xs font-semibold text-body">{row.label}
                <Input type="date" value={row.value} disabled={status==="ACTIVE"}
                  onChange={e=>row.set(e.target.value)}/></label>)}
        </div>
        {error?<p role="alert" className="text-sm font-semibold text-error">{error}</p>:null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={guard.requestClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!changed||!title.trim()}>
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
      <dl className="grid gap-2 text-sm text-body">
        <dt className="font-semibold text-foreground">Title</dt>
        <dd className="break-words">{title.trim()}</dd>
        <dt className="font-semibold text-foreground">Description</dt>
        <dd className="break-words">{description.trim()||"No description"}</dd>
      </dl>
      {error?<p role="alert" className="mt-3 text-sm font-semibold text-error">{error}</p>:null}
    </ConfirmDialog>
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard sprint changes?"
      description="You have unsaved project changes. Leave this page and discard them?"
      confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
  </>;
}
