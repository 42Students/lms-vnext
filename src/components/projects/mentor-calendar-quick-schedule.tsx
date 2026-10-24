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

type Choice={id:string;title:string;updatedAt:string;
  sprints:readonly {id:string;title:string;sequence:number;status:string}[]};
type MeetingType="GENERAL"|"PLANNING"|"STANDUP"|"REVIEW"|"RETRO";
const toInstant=(local:string)=>{
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))return null;
  const value=new Date(local+":00+05:30");
  return Number.isFinite(value.getTime())?value.toISOString():null;
};

export function MentorCalendarQuickSchedule({projects}:{
  projects:readonly Choice[];
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
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const project=projects.find(row=>row.id===selected);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!project||pending)return;
    setError(null);
    const from=toInstant(start),until=toInstant(end);
    if(!from||!until||Date.parse(until)<=Date.parse(from)||
       Date.parse(from)<=Date.now()){
      setError("Choose a valid future start and end time in IST.");
      return;
    }
    if(linkedSprintId&&!project.sprints.some(item=>item.id===linkedSprintId)){
      setError("Choose a sprint assigned to this project.");return;
    }
    const link=meetingUrl.trim();
    if(link){
      try{
        const url=new URL(link);
        if(!["http:","https:"].includes(url.protocol)||url.username||url.password||!url.hostname)
          throw Error("invalid");
      }catch{setError("Enter a valid HTTP or HTTPS join link.");return;}
    }
    setPending(true);
    try{
      await projectMutation(
        "/api/projects/"+encodeURIComponent(project.id)+"/meetings","POST",{
        expectedProjectUpdatedAt:project.updatedAt,
        title:title.trim(),
        ...(agenda.trim()?{agenda:agenda.trim()}:{}),
        startsAt:from,endsAt:until,timeZone:"Asia/Kolkata",
        meetingType,linkedSprintId:linkedSprintId||null,
        status:link?"SCHEDULED":"DRAFT",
        meetingUrl:link||null,
      });
      setOpen(false);setTitle("");setAgenda("");setStart("");setEnd("");setMeetingUrl("");
      setMeetingType("GENERAL");setLinkedSprintId("");
      showToast({tone:"success",title:link?"Meeting scheduled":"Meeting draft saved",
        description:link?"The meeting is recorded. Share the actual join link with attendees.":
          "Add a meeting link in the project's meeting editor to schedule the draft."});
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
      description="Choose one of your assigned projects. Times are in IST. Add a real meeting link to schedule, or save a draft to finish later.">
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
        <label>Meeting link (optional for a draft)
          <Input value={meetingUrl} type="url" maxLength={500} disabled={pending}
            onChange={event=>setMeetingUrl(event.target.value)}
            placeholder="https://meet.google.com/…"/>
        </label>
        <p className="prototype-mentor-calendar-quick-note">
          No Google Meet link is generated automatically. Structured attendance, notes and
          follow-ups can be edited on the project meeting record.
          {project?<Link href={"/mentor/projects/"+encodeURIComponent(project.id)+"?tab=team"}>
            Open full meeting editor →
          </Link>:null}
        </p>
        {error?<p role="alert" className="text-error">{error}</p>:null}
        <div className="prototype-mentor-calendar-quick-actions">
          <Button type="button" variant="secondary" disabled={pending}
            onClick={()=>setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={pending||!project||!title.trim()} loading={pending}>
            {meetingUrl.trim()?"Schedule meeting":"Save draft"}
          </Button>
        </div>
      </form>
    </Dialog>
  </>;
}
