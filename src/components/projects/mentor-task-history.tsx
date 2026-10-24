"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {apiFetch} from "@/lib/api-fetch";

type HistoryEvent={id:string;eventType:string;summary:string;
 occurredAt:string;actorDisplayName:string|null};
type Cursor={time:string;id:string};
type Page={events:HistoryEvent[];hasMore:boolean;nextCursor:Cursor|null};

/** Complete task-specific history is fetched from PostgreSQL using exact
 * subject ID and microsecond-safe cursors. Initial workspace snapshots do
 * not substitute for older or same-millisecond events.
 */
export function MentorTaskHistory({projectId,taskId}:{
 projectId:string;taskId:string;
}){
 const [events,setEvents]=useState<HistoryEvent[]>([]);
 const [loaded,setLoaded]=useState(false);
 const [cursor,setCursor]=useState<Cursor|null>(null);
 const [hasMore,setHasMore]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function load(){
  if(busy||(loaded&&!hasMore))return;
  setBusy(true);setError("");
  try{
   const query=new URLSearchParams({subjectId:taskId,size:"50"});
   if(loaded&&cursor){
    query.set("beforeTime",cursor.time);query.set("beforeId",cursor.id);
   }
   const page=await apiFetch<Page>("/api/projects/"+encodeURIComponent(projectId)+
     "/activity?"+query.toString(),{cache:"no-store",timeoutMs:15000});
   if(!Array.isArray(page.events))throw Error("Invalid activity response");
   setEvents(previous=>{
    const seen=new Set(previous.map(event=>event.id));
    return [...previous,...page.events.filter(event=>!seen.has(event.id))];
   });
   setCursor(page.nextCursor);setHasMore(page.hasMore);setLoaded(true);
   if(page.hasMore&&!page.nextCursor)
    setError("More activity exists but a continuation cursor was not returned.");
  }catch(caught){
   setError(caught instanceof Error?caught.message:
     "Could not load task history.");
  }finally{setBusy(false);}
 }
 return <section className="prototype-mentor-board-detail-block"
  aria-label="Complete recorded task activity">
  <h4>Task history</h4>
  {!loaded?<Button type="button" size="sm" variant="secondary" disabled={busy}
    loading={busy} onClick={()=>void load()}>
    Load recorded task history
  </Button>:<>
    {events.length?<ol className="space-y-2">
      {events.map(event=><li key={event.id}>
        {event.summary} · {event.actorDisplayName??"Recorded actor"}
        {" · "}<time dateTime={event.occurredAt}>
          {new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",
            year:"numeric",hour:"numeric",minute:"2-digit",
            timeZone:"Asia/Kolkata"}).format(new Date(event.occurredAt))} IST
        </time>
      </li>)}
    </ol>:<p>No recorded events for this exact task.</p>}
    {hasMore?<Button type="button" size="sm" variant="secondary"
      disabled={busy||cursor===null} loading={busy}
      onClick={()=>void load()}>
      Show older task events
    </Button>:<p>All available recorded task events have been loaded.</p>}
  </>}
  {error?<p role="alert">{error}</p>:null}
 </section>;
}
