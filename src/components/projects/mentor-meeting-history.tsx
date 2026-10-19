"use client";
import {useState} from "react";

export type MentorMeetingHistoryItem={
 id:string;title:string;status:string;startsAt:string;
};
const PREVIEW=6;
function when(value:string){
 const parsed=new Date(value);
 return Number.isFinite(parsed.getTime())?new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",timeZoneName:"short",
 }).format(parsed):"Date unavailable";
}
/** MEN-projects-meetings-26: bounded meeting-history preview and explicit reveal. */
export function MentorMeetingHistory({meetings}:{meetings:readonly MentorMeetingHistoryItem[]}){
 const [expanded,setExpanded]=useState(false);
 const visible=expanded?meetings:meetings.slice(0,PREVIEW);
 return <section className="mt-3 space-y-2 text-sm" aria-label="Meeting history">
  <h4 className="font-semibold">Past meetings / Meeting history ({meetings.length})</h4>
  {meetings.length===0?<p className="text-muted-foreground">No past meetings yet.</p>:
    <ul className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
      {visible.map(item=><li key={item.id} className="py-[var(--lms-space-3)]">
        <span className="font-medium">{item.title}</span>
        <span className="block text-xs text-muted-foreground">{when(item.startsAt)} · {item.status}</span>
      </li>)}
    </ul>}
  {meetings.length>PREVIEW?<button type="button"
    aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}
    className="min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
    {expanded?"Show fewer":"View all "+meetings.length}
  </button>:null}
 </section>;
}
