"use client";

import {useRouter} from "next/navigation";
import {useState} from "react";

type Session={
  id:string;title:string;startsAt:string;endsAt:string;
  updatedAt:string;marked:boolean;
};
export function FacultyAttendanceScheduleEditor({
  deliveryId,sessions,
}:{deliveryId:string;sessions:readonly Session[]}) {
  const router=useRouter();
  const [action,setAction]=useState<"CREATE"|"RESCHEDULE">("CREATE");
  const [id,setId]=useState(sessions.find(x=>!x.marked)?.id??"");
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [location,setLocation]=useState("");
  const [startsAt,setStartsAt]=useState("");
  const [endsAt,setEndsAt]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const selected=sessions.find(s=>s.id===id);
  async function save(){
    if(busy||action==="RESCHEDULE"&&(!selected||selected.marked))return;
    if(!window.confirm("Confirm "+(action==="CREATE"?"schedule":"reschedule")+" this Faculty attendance session?"))return;
    setBusy(true);setError(null);
    try{
      const payload={
        action,title,description:description||null,location:location||null,
        startsAt:new Date(startsAt).toISOString(),endsAt:new Date(endsAt).toISOString(),
        ...(action==="RESCHEDULE"?{
          sessionId:selected?.id,expectedUpdatedAt:selected?.updatedAt,
        }:{}),confirm:true,
      };
      const response=await fetch(
        "/api/courses/faculty/attendance/"+encodeURIComponent(deliveryId)+"/schedule",
        {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)},
      );
      if(!response.ok)throw new Error(
        "Session was not saved. Check the current schedule, Section ownership and version.");
      router.refresh();
    }catch(e){setError(e instanceof Error?e.message:"Session update failed.");}
    finally{setBusy(false);}
  }
  return <section aria-label="Faculty attendance session scheduling"
    className="space-y-3 rounded-xl border border-border bg-surface p-4">
    <h2 className="font-semibold text-foreground">Schedule an attendance session</h2>
    <p className="text-xs text-muted-foreground">
      Times are entered in your device time zone and saved as offset-aware instants.
      Sessions already marked for attendance cannot be moved.
    </p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">Action
        <select value={action} onChange={e=>setAction(e.target.value as typeof action)}
          className="min-h-10 rounded border border-border bg-background p-2">
          <option value="CREATE">Schedule</option>
          <option value="RESCHEDULE">Reschedule</option>
        </select>
      </label>
      {action==="RESCHEDULE"?<label className="grid gap-1 text-sm">Unmarked session
        <select value={id} onChange={e=>setId(e.target.value)}
          className="min-h-10 rounded border border-border bg-background p-2">
          {sessions.filter(s=>!s.marked).map(s=>
            <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </label>:null}
      <label className="grid gap-1 text-sm">Session title
        <input value={title} onChange={e=>setTitle(e.target.value)}
          maxLength={160} className="min-h-10 rounded border border-border bg-background p-2" />
      </label>
      <label className="grid gap-1 text-sm">Location
        <input value={location} onChange={e=>setLocation(e.target.value)}
          maxLength={240} className="min-h-10 rounded border border-border bg-background p-2" />
      </label>
      <label className="grid gap-1 text-sm">Start
        <input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)}
          className="min-h-10 rounded border border-border bg-background p-2" />
      </label>
      <label className="grid gap-1 text-sm">End
        <input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)}
          className="min-h-10 rounded border border-border bg-background p-2" />
      </label>
    </div>
    <label className="grid gap-1 text-sm">Description
      <textarea value={description} onChange={e=>setDescription(e.target.value)}
        maxLength={1000} className="min-h-20 rounded border border-border bg-background p-2" />
    </label>
    <button type="button" onClick={save}
      disabled={busy||action==="RESCHEDULE"&&!selected}
      className="min-h-10 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
      {busy?"Saving…":"Confirm "+(action==="CREATE"?"schedule":"reschedule")}
    </button>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  </section>;
}
