"use client";
import {useId,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {fromIstLocalInput,toIstLocalInput,mentorMeetingRescheduleSchema}
  from "@/modules/projects/mentor-meeting-reschedule-model";
import {Input} from "@/components/ui/input";
import styles from "./legacy-project-touch-actions.module.css";

export function MentorMeetingReschedule(props:{
  projectId:string;meetingId:string;startsAt:string;endsAt:string;updatedAt:string;
}){
  const router=useRouter();
  const validationId=useId();
  const {showToast}=useToast();
  const [start,setStart]=useState(toIstLocalInput(props.startsAt));
  const [end,setEnd]=useState(toIstLocalInput(props.endsAt));
  const [open,setOpen]=useState(false);
  const [confirm,setConfirm]=useState(false);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const payload={
    startsAt:fromIstLocalInput(start),endsAt:fromIstLocalInput(end),
    expectedUpdatedAt:props.updatedAt,confirmed:true as const,
  };
  const parsed=mentorMeetingRescheduleSchema.safeParse(payload);
  const dirty=start!==toIstLocalInput(props.startsAt)||end!==toIstLocalInput(props.endsAt);
  const guard=useProjectEditorDiscardGuard(open||confirm,dirty,pending,()=>{setOpen(false);setConfirm(false);setError(null);});
  const changed=payload.startsAt!==props.startsAt||payload.endsAt!==props.endsAt;
  async function save(){
    if(!parsed.success||!changed||pending)return;
    setPending(true);setError(null);
    try{
      await projectMutation("/api/projects/"+encodeURIComponent(props.projectId)+
        "/meetings/"+encodeURIComponent(props.meetingId)+"/mentor-reschedule",
        "PATCH",parsed.data);
      setConfirm(false);
      showToast({tone:"success",title:"Meeting rescheduled"});
      router.refresh();
    }catch(caught){
      const message=caught instanceof FriendlyFetchError?caught.message:friendlyApiError({});
      setError(message);
      showToast({tone:"error",title:"Meeting not rescheduled",description:message});
    }finally{setPending(false);}
  }
  return <div className={styles.legacy+" "+styles.contents}>
    <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>{
      setStart(toIstLocalInput(props.startsAt));
      setEnd(toIstLocalInput(props.endsAt));setError(null);setOpen(true);
    }}>Reschedule</Button>
    <Dialog open={open} onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}} title="Reschedule meeting"
      description="Times are in Indian Standard Time (IST). The link and existing agenda stay unchanged.">
      <form onSubmit={event=>{
        event.preventDefault();if(parsed.success&&changed){setOpen(false);setConfirm(true);}
      }} className="grid gap-4">
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start (IST)
          <Input data-slot="input" type="datetime-local" required value={start}
            aria-invalid={!parsed.success} aria-describedby={!parsed.success?validationId:undefined}
            onChange={event=>{setStart(event.target.value);setError(null);}}
            className="min-h-11 min-w-0 max-w-full md:min-h-9"/>
        </label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">End (IST)
          <Input data-slot="input" type="datetime-local" required value={end}
            aria-invalid={!parsed.success} aria-describedby={!parsed.success?validationId:undefined}
            onChange={event=>{setEnd(event.target.value);setError(null);}}
            className="min-h-11 min-w-0 max-w-full md:min-h-9"/>
        </label>
        {!parsed.success?<p id={validationId} role="alert" className="text-sm text-foreground leading-[22px]">
          Select valid start/end times, with a duration up to 12 hours.</p>:null}
        {error?<p role="alert" className="text-sm text-error leading-[22px]">{error}</p>:null}
        <div className="flex min-w-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={guard.requestClose}>Cancel</Button>
          <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={!parsed.success||!changed||pending}>
            Review reschedule</Button>
        </div>
      </form>
    </Dialog>
    <ConfirmDialog open={confirm} onOpenChange={next=>{if(pending)return;setConfirm(next);if(!next)setOpen(true);}}
      title="Confirm meeting reschedule?" confirmLabel="Confirm reschedule"
      description="Your new IST time will be checked for conflicts. Project members are notified in-app after rescheduling; no calendar invitation or email is sent."
      pending={pending} onConfirm={save}>
      <p className="text-sm text-body leading-[22px]">{start.replace("T"," ")} – {end.replace("T"," ")} IST</p>
      {error?<p role="alert" className="text-sm text-error leading-[22px]">{error}</p>:null}
    </ConfirmDialog>
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard reschedule changes?" description="You have unsaved project changes. Leave this page and discard them?"
      confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
  </div>;
}
