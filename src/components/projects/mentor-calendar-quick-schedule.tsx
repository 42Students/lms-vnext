"use client";

import {useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";
import {fromIstLocalInput} from "@/modules/projects/mentor-meeting-reschedule-model";
import {mentorQuickGoogleScheduleFeedback} from
 "@/modules/projects/mentor-quick-google-schedule-feedback";

type Choice={id:string;title:string;updatedAt:string;
  sprints:readonly {id:string;title:string;sequence:number;status:string}[]};
type MeetingType="GENERAL"|"PLANNING"|"STANDUP"|"REVIEW"|"RETRO";
export function MentorCalendarQuickSchedule({projects,googleConnected}:{
  projects:readonly Choice[];googleConnected:boolean;
}){
  const router=useRouter();
  const {showToast}=useToast();
  const [open,setOpen]=useState(false);
  const [selected,setSelected]=useState(projects[0]?.id??"");
  const [title,setTitle]=useState("");
  const [agenda,setAgenda]=useState("");
  const [meetingType,setMeetingType]=useState<MeetingType>("GENERAL");
  const [linkedSprintId,setLinkedSprintId]=useState("");
  const [start,setStart]=useState("");
  const [end,setEnd]=useState("");
  const [meetingUrl,setMeetingUrl]=useState("");
  const [venue,setVenue]=useState("");
  const [useGoogle,setUseGoogle]=useState(false);
  const [repeat,setRepeat]=useState<"once"|"4"|"8">("once");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const project=projects.find(row=>row.id===selected);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!project||pending)return;
    setError(null);
    const from=fromIstLocalInput(start),until=fromIstLocalInput(end);
    if(!from||!until||Date.parse(until)<=Date.parse(from)||
       Date.parse(from)<=Date.now()){
      setError("Choose a valid future start and end time in IST.");
      return;
    }
    if(linkedSprintId&&!project.sprints.some(item=>item.id===linkedSprintId)){
      setError("Choose a sprint assigned to this project.");return;
    }
    const link=meetingUrl.trim();
    const location=venue.trim();
    if(location.length>200){setError("Physical venue must be at most 200 characters.");return;}
    if(link){
      try{
        const url=new URL(link);
        if(!["http:","https:"].includes(url.protocol)||url.username||url.password||!url.hostname)
          throw Error("invalid");
      }catch{setError("Enter a valid HTTP or HTTPS join link.");return;}
    }
    setPending(true);
    try{
      // Persist the real authorized project meeting first; a remote provider
      // failure must never lose the draft or be presented as scheduling success.
      const saved:unknown=await projectMutation(
        "/api/projects/"+encodeURIComponent(project.id)+"/meetings","POST",{
        expectedProjectUpdatedAt:project.updatedAt,
        title:title.trim(),
        ...(agenda.trim()?{agenda:agenda.trim()}:{}),
        startsAt:from,endsAt:until,timeZone:"Asia/Kolkata",
        meetingType,linkedSprintId:linkedSprintId||null,
        status:link||location?"SCHEDULED":"DRAFT",
        meetingUrl:link||null,
        ...(location?{location}:{}),
      });
      let titleForToast=link||location?"Meeting scheduled":"Meeting draft saved";
      let description=link?
        "The meeting is recorded. Share the actual join link with attendees.":
        location?"In-person meeting recorded at "+location+". The team can find the venue in the meeting agenda.":
        "Open the draft in Meetings to generate a verified Google Meet link, or add your own link.";
      if(!link&&!location&&useGoogle&&googleConnected){
        const row=saved&&typeof saved==="object"&&"meeting" in saved?
          saved.meeting:null;
        const id=row&&typeof row==="object"&&"id" in row?
          row.id:null;
        if(typeof id!=="string"||
          !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)){
          description="The draft was saved, but its meeting ID could not be verified for Google sync. Open Meetings and retry there.";
        }else{
          try{
            const sync=await fetch("/api/projects/"+
              encodeURIComponent(project.id)+"/meetings/"+
              encodeURIComponent(id)+"/google",{
              method:"POST",credentials:"same-origin",cache:"no-store",
              headers:{"Content-Type":"application/json"},
              body:JSON.stringify(repeat==="once"?{}:{weeklyCount:Number(repeat)}),
            });
            if(!sync.ok)throw Error("Google provider did not confirm meeting creation");
            const feedback=mentorQuickGoogleScheduleFeedback(await sync.json() as unknown);
            titleForToast=feedback.title;
            description=feedback.description;
          }catch{
            description="The meeting draft was saved, but Google synchronization was not verified. Open Meetings to retry without creating another draft.";
          }
        }
      }
      setOpen(false);setTitle("");setAgenda("");setStart("");setEnd("");setMeetingUrl("");
      setMeetingType("GENERAL");setLinkedSprintId("");setUseGoogle(false);setRepeat("once");setVenue("");
      showToast({tone:"success",title:titleForToast,description});
      router.refresh();
    }catch{
      setError("Could not save this meeting. It may overlap another meeting, or the project has changed. Review and try again.");
    }finally{setPending(false);}
  }
  return <>
    <Button type="button" size="sm" disabled={!projects.length}
      onClick={()=>{setError(null);setOpen(true);}}>
      Schedule a meeting
    </Button>
    <Dialog title="Schedule a meeting" open={open}
      onOpenChange={next=>{if(!pending)setOpen(next);}}
      description="Choose an assigned project and IST time. Add a real join link, save a draft, or create a Google Meet in one action when consent is saved.">
      <form onSubmit={submit} className="prototype-mentor-calendar-quick-form">
        <label>Team or project
          <select value={selected} onChange={event=>{setSelected(event.target.value);setLinkedSprintId("");}}
            disabled={pending} required>
            {projects.map(row=><option key={row.id} value={row.id}>{row.title}</option>)}
          </select>
        </label>
        <label>Meeting type
          <select value={meetingType} disabled={pending}
            onChange={event=>setMeetingType(event.target.value as MeetingType)}>
            <option value="GENERAL">General</option>
            <option value="PLANNING">Sprint planning</option>
            <option value="STANDUP">Stand-up</option>
            <option value="REVIEW">Sprint review</option>
            <option value="RETRO">Retrospective</option>
          </select>
        </label>
        <label>Linked sprint (optional)
          <select value={linkedSprintId} disabled={pending}
            onChange={event=>setLinkedSprintId(event.target.value)}>
            <option value="">No linked sprint</option>
            {project?.sprints.map(item=><option key={item.id} value={item.id}>
              Sprint {item.sequence} · {item.title} ({item.status.toLowerCase()})
            </option>)}
          </select>
        </label>
        <label>Meeting title
          <Input required value={title} maxLength={200} disabled={pending}
            onChange={event=>setTitle(event.target.value)} placeholder="Weekly sprint review"/>
        </label>
        <label>Agenda
          <Textarea value={agenda} maxLength={4000} disabled={pending}
            onChange={event=>setAgenda(event.target.value)}
            rows={2} placeholder="What should the team discuss?"/>
        </label>
        <div className="prototype-mentor-calendar-quick-dates">
          <label>Starts (IST)
            <Input required type="datetime-local" value={start} disabled={pending}
              onChange={event=>setStart(event.target.value)}/>
          </label>
          <label>Ends (IST)
            <Input required type="datetime-local" value={end} disabled={pending}
              onChange={event=>setEnd(event.target.value)}/>
          </label>
        </div>
        <label>Meeting link (optional for in-person or draft meetings)
          <Input value={meetingUrl} type="url" maxLength={500} disabled={pending}
            onChange={event=>setMeetingUrl(event.target.value)}
            placeholder="https://meet.google.com/…"/>
        </label>
        <label>Physical venue (optional for an online meeting)
          <Input value={venue} type="text" maxLength={200} disabled={pending}
            onChange={event=>setVenue(event.target.value)}
            placeholder="Lab 2, Room 304"/>
        </label>
        {!meetingUrl.trim()&&!venue.trim()&&googleConnected?
          <div className="space-y-2 rounded border border-border p-3">
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" className="size-5" checked={useGoogle}
                disabled={pending} onChange={event=>setUseGoogle(event.target.checked)}/>
              Generate a Google Meet link and invite the active team on save
            </label>
            {useGoogle?<label className="block text-sm">Repeat on Google Calendar
              <select className="ml-2 min-h-11 rounded border border-border bg-background p-2"
                value={repeat} disabled={pending}
                onChange={event=>setRepeat(event.target.value as "once"|"4"|"8")}>
                <option value="once">Once</option>
                <option value="4">Weekly × 4</option>
                <option value="8">Weekly × 8</option>
              </select>
            </label>:null}
            <p className="text-xs text-muted-foreground">
              Saved consent is not proof of a live grant. Google creates the event
              only after the draft is saved. If sync fails, the draft remains
              available for retry; attendee email delivery and RSVPs are not guaranteed.
              Invite a selected subset from the meeting details instead.
            </p>
          </div>:null}
                <p className="prototype-mentor-calendar-quick-note">
          A saved draft can also generate its Google Meet link later in Meetings.
          Attendance, notes and follow-ups are edited on the project meeting record.
          {project?<Link href={"/mentor/projects/"+encodeURIComponent(project.id)+"?tab=team"}>
            Open full meeting editor →
          </Link>:null}
        </p>
        {error?<p role="alert" className="text-error">{error}</p>:null}
        <div className="prototype-mentor-calendar-quick-actions">
          <Button type="button" variant="secondary" disabled={pending}
            onClick={()=>setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={pending||!project||!title.trim()} loading={pending}>
            {meetingUrl.trim()||venue.trim()?"Schedule meeting":useGoogle&&googleConnected?
              "Save and create Google Meet":"Save draft"}
          </Button>
        </div>
      </form>
    </Dialog>
  </>;
}
