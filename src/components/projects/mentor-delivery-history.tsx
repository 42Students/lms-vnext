"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";

export type MentorDeliveryHistoryEntry={
 id:string;version:number;kind:string;occurredAt:string;
 actorName:string|null;feedback:string|null;
};
export function MentorDeliveryHistory({events}:{events:readonly MentorDeliveryHistoryEntry[]}){
 const [limit,setLimit]=useState(20);
 const ordered=[...events].sort((a,b)=>
   b.occurredAt.localeCompare(a.occurredAt)||
   b.version-a.version||b.id.localeCompare(a.id));
 const shown=ordered.slice(0,limit);
 return <div className="prototype-mentor-delivery-history">
   <h3>Submission and review history · {events.length} recorded events</h3>
   <p>Newest first · each attempt retains its own version and reviewer feedback.</p>
   {shown.length?<ol>{shown.map(event=><li key={event.id}>
     <strong>Version {event.version} · {event.kind.replaceAll("_"," ")}</strong>
     <span>{event.actorName||"Project team"} ·
       {" "}{new Intl.DateTimeFormat("en-IN",{
         day:"numeric",month:"short",year:"numeric",hour:"numeric",
         minute:"2-digit",timeZone:"Asia/Kolkata",
       }).format(new Date(event.occurredAt))} IST</span>
     {event.feedback?<p>Feedback: {event.feedback}</p>:null}
   </li>)}</ol>:<p className="prototype-mentor-summary-empty">
     No submission or review history recorded.</p>}
   {shown.length<ordered.length?<Button type="button" size="sm" variant="secondary"
     onClick={()=>setLimit(value=>value+20)}>
     Show next {Math.min(20,ordered.length-shown.length)} events
   </Button>:null}
 </div>;
}
