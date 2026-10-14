"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";
import {fromIstLocalInput,toIstLocalInput,mentorMeetingRescheduleSchema}
  from "@/modules/projects/mentor-meeting-reschedule-model";

export function MentorMeetingReschedule(props:{
  projectId:string;meetingId:string;startsAt:string;endsAt:string;updatedAt:string;
}){
  const router=useRouter();
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
  const changed=payload.startsAt!==props.startsAt||payload.endsAt!==props.endsAt;
  async function save(){
    if(!parsed.success||!changed)return;
    setPending(true);setError(null);
    try{
      await projectMutation("/api/projects/"+encodeURIComponent(props.projectId)+
        "/meetings/"+encodeURIComponent(props.meetingId)+"/mentor-reschedule",
        "PATCH",parsed.data);
      setConfirm(false);
      showToast({tone:"success",title:"Meeting rescheduled"});
      router.refresh();
    }catch(caught){
      const message=caught instanceof Error?caught.message:"Meeting update failed";
      setError(message);
      showToast({tone:"error",title:"Meeting not rescheduled",description:message});
    }finally{setPending(false);}
  }
  return <>
    <Button variant="secondary" size="sm" onClick={()=>{
      setStart(toIstLocalInput(props.startsAt));
      setEnd(toIstLocalInput(props.endsAt));setError(null);setOpen(true);
    }}>Reschedule</Button>
    <Dialog open={open} onOpenChange={setOpen} title="Reschedule meeting"
      description="Times are in Indian Standard Time (IST). The link and existing agenda stay unchanged.">
      <form onSubmit={event=>{
        event.preventDefault();if(parsed.success&&changed){setOpen(false);setConfirm(true);}
      }} className="grid gap-4">
        <label className="grid gap-1 text-sm font-semibold text-body">Start (IST)
          <input type="datetime-local" required value={start}
            onChange={event=>setStart(event.target.value)}
            className="min-h-10 rounded-md border border-border bg-background px-3"/>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">End (IST)
          <input type="datetime-local" required value={end}
            onChange={event=>setEnd(event.target.value)}
            className="min-h-10 rounded-md border border-border bg-background px-3"/>
        </label>
        {!parsed.success?<p role="alert" className="text-sm text-error">
          Select valid start/end times, with a duration up to 12 hours.</p>:null}
        {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={!parsed.success||!changed||pending}>
            Review reschedule</Button>
        </div>
      </form>
    </Dialog>
    <ConfirmDialog open={confirm} onOpenChange={setConfirm}
      title="Confirm meeting reschedule?" confirmLabel="Confirm reschedule"
      description="Your new IST time will be checked against this project's scheduled meetings. No external message is sent."
      pending={pending} onConfirm={save}>
      <p className="text-sm text-body">{start.replace("T"," ")} – {end.replace("T"," ")} IST</p>
      {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    </ConfirmDialog>
  </>;
}
