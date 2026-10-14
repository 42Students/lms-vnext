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

export function MentorSprintDetailsEdit({
  projectId,sprintId,title:originalTitle,
  description:originalDescription,updatedAt,
}:{
  projectId:string;sprintId:string;title:string;
  description:string|null;updatedAt:string;
}) {
  const router=useRouter();
  const {showToast}=useToast();
  const [open,setOpen]=useState(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [title,setTitle]=useState(originalTitle);
  const [description,setDescription]=useState(originalDescription??"");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const changed=title.trim()!==originalTitle ||
    (description.trim()||null)!==(originalDescription??null);
  function begin() {
    setTitle(originalTitle);
    setDescription(originalDescription??"");
    setError(null);
    setOpen(true);
  }
  function review(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!title.trim()||title.trim().length>200||description.trim().length>4000||!changed) {
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
    <Dialog open={open} onOpenChange={setOpen} title="Edit sprint details"
      description="Only the title and description are editable. Sprint lifecycle state stays unchanged.">
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
        {error?<p role="alert" className="text-sm font-semibold text-error">{error}</p>:null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={()=>setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={!changed||!title.trim()}>
            Review changes
          </Button>
        </div>
      </form>
    </Dialog>
    <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
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
  </>;
}
