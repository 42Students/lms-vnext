"use client";
import { Textarea } from "@/components/ui/textarea";
import {useId,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import styles from "./legacy-project-touch-actions.module.css";
export function MentorMeetingNotesEditor(props:{
  projectId:string;meetingId:string;updatedAt:string;initialNotes:string|null;
}){
  const router=useRouter();
  const helpId=useId();
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
  return <div className={styles["legacy"]+" "+styles["contents"]}>
    <Button variant="secondary" aria-haspopup="dialog" aria-expanded={open||confirm}
      className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>{
      setNotes(props.initialNotes??"");setError(null);setOpen(true);
    }}>{props.initialNotes?"Edit outcome notes":"Record outcome notes"}</Button>
    <Dialog open={open} onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}} title="Meeting outcome notes"
      description="Record the outcome for this completed meeting. Changes replace the current text; an audit event records the edit, not the old text.">
      <form onSubmit={event=>{event.preventDefault();if(valid){setOpen(false);setConfirm(true);}}}
        className="grid gap-[var(--lms-space-3)]">
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Notes
          <Textarea value={notes} rows={7} maxLength={4000} required aria-describedby={helpId}
            onChange={event=>setNotes(event.target.value)}
            className="w-full min-w-0 max-w-full"/>
        </label>
        <p id={helpId} className="text-right text-xs text-muted-foreground">{notes.trim().length}/4000 characters</p>
        {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
        <div className="flex flex-col-reverse gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={guard.requestClose}>Cancel</Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={!valid||pending}>Review notes</Button>
        </div>
      </form>
    </Dialog>
    <ConfirmDialog open={confirm} onOpenChange={next=>{if(pending)return;setConfirm(next);if(!next)setOpen(true);}}
      title="Save meeting outcome notes?" confirmLabel="Save notes"
      description="The current outcome will be replaced for this meeting. The change is audited without exposing note contents in activity history."
      pending={pending} onConfirm={submit}>
      <p tabIndex={0} className="max-h-44 overflow-auto whitespace-pre-wrap break-words border-y border-[var(--lms-canvas-border)] py-[var(--lms-space-3)] text-sm text-body focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        {notes.trim()}</p>
      {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    </ConfirmDialog>
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard meeting notes?" description="You have unsaved project changes. Leave this page and discard them?"
      confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
  </div>;
}
