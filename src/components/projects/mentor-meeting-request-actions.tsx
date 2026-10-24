"use client";

import {useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {projectMutation} from "./project-api";
import type {MentorMeetingCalendarItem} from "@/modules/projects/mentor-calendar-view";

const displayIst=(instant:string)=>{
  const date=new Date(instant);
  return Number.isFinite(date.getTime())?
    new Date(date.getTime()+330*60_000).toISOString().slice(0,16):"";
};
const parseIst=(local:string)=>{
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))return null;
  const date=new Date(local+":00+05:30");
  return Number.isFinite(date.getTime())?date.toISOString():null;
};

/** The prototype's Yes / Another time / No decisions use actual supported
 * scheduling and mentor decision endpoints. "Another time" opens the editor;
 * it never reports a reschedule as saved without a new time. */
export function MentorMeetingRequestActions({meeting}:{
  meeting:MentorMeetingCalendarItem;
}){
  const router=useRouter();
  const [action,setAction]=useState<"YES"|"NO"|null>(null);
  const [startsAt,setStartsAt]=useState(displayIst(meeting.startsAt));
  const [endsAt,setEndsAt]=useState(displayIst(meeting.endsAt));
  const [joinUrl,setJoinUrl]=useState("");
  const [note,setNote]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  if(meeting.status!=="REQUESTED"||meeting.projectStatus!=="ACTIVE"||!meeting.updatedAt)
    return null;
  const editor="/mentor/projects/"+encodeURIComponent(meeting.projectId)+
    "?tab=team#meeting-"+encodeURIComponent(meeting.id);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy||!action)return;
    setError(null);
    const base="/api/projects/"+encodeURIComponent(meeting.projectId)+
      "/meetings/"+encodeURIComponent(meeting.id);
    setBusy(true);
    try{
      if(action==="YES"){
        const from=parseIst(startsAt),until=parseIst(endsAt);
        if(!from||!until||Date.parse(from)<=Date.now()||Date.parse(until)<=Date.parse(from))
          throw Error("Choose a future time window in IST.");
        let url:URL;
        try{url=new URL(joinUrl.trim());}catch{throw Error("A real meeting join link is required.");}
        if(!["http:","https:"].includes(url.protocol)||url.username||url.password||!url.hostname)
          throw Error("Enter a valid HTTP or HTTPS meeting join link.");
        await projectMutation(base,"PATCH",{
          expectedUpdatedAt:meeting.updatedAt,
          title:meeting.title,
          agenda:meeting.agenda??null,
          startsAt:from,endsAt:until,timeZone:"Asia/Kolkata",
          meetingType:meeting.meetingType??"GENERAL",
          status:"SCHEDULED",
          meetingUrl:url.toString(),
        });
      }else{
        await projectMutation(base+"/mentor-decision","POST",{
          action:"CANCEL",confirmed:true,
          expectedUpdatedAt:meeting.updatedAt,
          ...(note.trim()?{note:note.trim()}:{}),
        });
      }
      setAction(null);setBusy(false);router.refresh();
    }catch(reason){
      setError(reason instanceof Error?reason.message:
        "The meeting request changed or could not be saved. Refresh and try again.");
      setBusy(false);
    }
  }
  return <section className="prototype-mentor-meeting-request" aria-label="Answer meeting request">
    <h3>Meeting request · needs your answer</h3>
    <p>Accept the requested time with a real join link, propose another time in the
      project editor, or decline with an optional note. The team is informed only
      after the server saves the decision.</p>
    <div className="prototype-mentor-meeting-request-buttons">
      <Button type="button" size="sm" onClick={()=>{setError(null);setAction("YES");}}>
        Yes, this time
      </Button>
      <Link href={editor}>Another time</Link>
      <Button type="button" size="sm" variant="secondary"
        onClick={()=>{setError(null);setAction("NO");}}>
        No, answer in a note
      </Button>
    </div>
    <Dialog title={action==="YES"?"Accept meeting request":"Decline meeting request"}
      description={action==="YES"?"Confirm the time and provide the actual link. No link is generated automatically.":
        "Declining keeps the request and note in the project's history."}
      open={action!==null}
      onOpenChange={next=>{if(!next&&!busy)setAction(null);}}>
      <form onSubmit={submit} className="prototype-mentor-meeting-decision-form">
        {action==="YES"?<>
          <label>Start time (IST)
            <Input required type="datetime-local" value={startsAt} disabled={busy}
              onChange={event=>setStartsAt(event.target.value)}/>
          </label>
          <label>End time (IST)
            <Input required type="datetime-local" value={endsAt} disabled={busy}
              onChange={event=>setEndsAt(event.target.value)}/>
          </label>
          <label>Meeting join link
            <Input required type="url" value={joinUrl} maxLength={500} disabled={busy}
              onChange={event=>setJoinUrl(event.target.value)}
              placeholder="https://meet.google.com/..."/>
          </label>
        </>:<label>Note for the team (optional)
          <Textarea value={note} onChange={event=>setNote(event.target.value)}
            disabled={busy} maxLength={2000} rows={3}
            placeholder="Explain why this time doesn't work."/>
        </label>}
        {error?<p role="alert">{error}</p>:null}
        <div className="prototype-mentor-meeting-decision-actions">
          <Button type="button" variant="secondary" disabled={busy}
            onClick={()=>setAction(null)}>Back</Button>
          <Button type="submit" loading={busy} disabled={busy}>
            {action==="YES"?"Confirm meeting":"Decline request"}
          </Button>
        </div>
      </form>
    </Dialog>
  </section>;
}
