"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";
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
  const valid=notes.trim().length>0&&notes.trim().length<=4000&&
    notes.trim()!==(props.initialNotes??"").trim();
  async function submit(){
    if(!valid)return;
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
      const message=caught instanceof Error?caught.message:"Saving notes failed";
      setError(message);
      showToast({tone:"error",title:"Meeting notes not saved",description:message});
    }finally{setPending(false);}
  }
  return <>
    <Button variant="secondary" onClick={()=>{
      setNotes(props.initialNotes??"");setError(null);setOpen(true);
    }}>{props.initialNotes?"Edit outcome notes":"Record outcome notes"}</Button>
    <Dialog open={open} onOpenChange={setOpen} title="Meeting outcome notes"
      description="Record the outcome for this completed meeting. Changes replace the current text; an audit event records the edit, not the old text.">
      <form onSubmit={event=>{event.preventDefault();if(valid){setOpen(false);setConfirm(true);}}}
        className="grid gap-3">
        <label className="grid gap-1 text-sm font-semibold text-body">Notes
          <textarea value={notes} rows={7} maxLength={4000} required
            onChange={event=>setNotes(event.target.value)}
            className="w-full min-h-32 rounded-md border border-border bg-background px-3 py-2 text-foreground"/>
        </label>
        <p className="text-xs text-muted-foreground">{notes.trim().length}/4000 characters</p>
        {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={!valid||pending}>Review notes</Button>
        </div>
      </form>
    </Dialog>
    <ConfirmDialog open={confirm} onOpenChange={setConfirm}
      title="Save meeting outcome notes?" confirmLabel="Save notes"
      description="The current outcome will be replaced for this meeting. The change is audited without exposing note contents in activity history."
      pending={pending} onConfirm={submit}>
      <p className="max-h-44 overflow-auto whitespace-pre-wrap break-words text-sm text-body">
        {notes.trim()}</p>
      {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    </ConfirmDialog>
  </>;
}
