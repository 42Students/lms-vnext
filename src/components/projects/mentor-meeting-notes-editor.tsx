"use client";
import { Textarea } from "@/components/ui/textarea";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
export function MentorMeetingNotesEditor(props:{
  projectId:string;meetingId:string;updatedAt:string;initialNotes:string|null;
}){
  const router=useRouter();
  const {showToast}=useToast();
  const [notes,setNotes]=useState(props.initialNotes??"");
  const [open,setOpen]=useState(false);
  const [confirm,setConfirm]=useState(false);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const changed=notes.trim()!==(props.initialNotes??"").trim();
  const guard=useProjectEditorDiscardGuard(open||confirm,changed,pending,()=>{setOpen(false);setConfirm(false);setError(null);});
  const valid=notes.trim().length>0&&notes.trim().length<=4000&&
    notes.trim()!==(props.initialNotes??"").trim();
  async function submit(){
    if(!valid||pending)return;
    setPending(true);setError(null);
    try{
      await projectMutation("/api/projects/"+encodeURIComponent(props.projectId)+
        "/meetings/"+encodeURIComponent(props.meetingId)+"/mentor-notes","PATCH",{
          outcome:notes.trim(),expectedUpdatedAt:props.updatedAt,confirmed:true,
        });
      setConfirm(false);
      showToast({tone:"success",title:"Meeting notes saved"});
      router.refresh();
    }catch(caught){
      const message=caught instanceof FriendlyFetchError?caught.message:friendlyApiError({});
      setError(message);
      showToast({tone:"error",title:"Meeting notes not saved",description:message});
    }finally{setPending(false);}
  }
  return <>
    <Button variant="secondary" onClick={()=>{
      setNotes(props.initialNotes??"");setError(null);setOpen(true);
    }}>{props.initialNotes?"Edit outcome notes":"Record outcome notes"}</Button>
    <Dialog open={open} onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}} title="Meeting outcome notes"
      description="Record the outcome for this completed meeting. Changes replace the current text; an audit event records the edit, not the old text.">
      <form onSubmit={event=>{event.preventDefault();if(valid){setOpen(false);setConfirm(true);}}}
        className="grid gap-3">
        <label className="grid gap-1 text-sm font-semibold text-body">Notes
          <Textarea value={notes} rows={7} maxLength={4000} required
            onChange={event=>setNotes(event.target.value)}
            className="w-full min-h-32 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 py-2 text-[14px] text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/>
        </label>
        <p className="text-xs text-muted-foreground">{notes.trim().length}/4000 characters</p>
        {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={guard.requestClose}>Cancel</Button>
          <Button type="submit" disabled={!valid||pending}>Review notes</Button>
        </div>
      </form>
    </Dialog>
    <ConfirmDialog open={confirm} onOpenChange={next=>{setConfirm(next);if(!next&&!pending)setOpen(true);}}
      title="Save meeting outcome notes?" confirmLabel="Save notes"
      description="The current outcome will be replaced for this meeting. The change is audited without exposing note contents in activity history."
      pending={pending} onConfirm={submit}>
      <p className="max-h-44 overflow-auto whitespace-pre-wrap break-words text-sm text-body">
        {notes.trim()}</p>
      {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    </ConfirmDialog>
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard meeting notes?" description="You have unsaved project changes. Leave this page and discard them?"
      confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
  </>;
}
