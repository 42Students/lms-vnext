"use client";
import { facultyScheduleFieldsChanged, facultyScheduleErrorMessage } from "@/modules/attendance/faculty-schedule-mutation-model";

import {useRouter} from "next/navigation";
import {useState} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import { Alert } from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {localDateTimeInput,validateFacultyScheduleWindow,facultyScheduleInstants} from
  "@/modules/attendance/faculty-schedule-editor-model";

type Session={
  id:string;title:string;startsAt:string;endsAt:string;
  updatedAt:string;marked:boolean;description:string|null;location:string|null;
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
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [success,setSuccess]=useState<string|null>(null);
  const eligible=sessions.filter(s=>!s.marked);
  const selected=eligible.find(s=>s.id===id);
  let unchanged = false;
  if(action==="RESCHEDULE"&&selected){
    try {
      unchanged=!facultyScheduleFieldsChanged({...selected,startsAt:new Date(selected.startsAt),endsAt:new Date(selected.endsAt)},
        {title,description:description||null,location:location||null,...facultyScheduleInstants(startsAt,endsAt,selected)});
    } catch { /* Invalid fields are explained by save validation. */ }
  }
  function applyExistingSession(session:Session){
    setId(session.id);
    setTitle(session.title);
    setDescription(session.description??"");
    setLocation(session.location??"");
    setStartsAt(localDateTimeInput(session.startsAt));
    setEndsAt(localDateTimeInput(session.endsAt));
    setError(null);setSuccess(null);
  }
  function changeAction(next:"CREATE"|"RESCHEDULE"){
    setAction(next);setError(null);setSuccess(null);
    if(next==="RESCHEDULE"&&eligible[0])applyExistingSession(selected??eligible[0]);
    if(next==="CREATE"){
      setTitle("");setDescription("");setLocation("");setStartsAt("");setEndsAt("");
    }
  }
  async function save(confirmed=false){
    if(busy)return;
    if(action==="RESCHEDULE"&&!selected){
      setError("Choose an unmarked attendance session you own.");return;
    }
    if(title.trim().length<3){
      setError("Enter a session title of at least three characters.");return;
    }
    const timingError=validateFacultyScheduleWindow(startsAt,endsAt,action==="RESCHEDULE"?selected:undefined);
    if(timingError){setError(timingError);return;}
    if(unchanged){setError("No schedule details changed; nothing was saved.");return;}
    if(!confirmed){setConfirmOpen(true);return;}
    setBusy(true);setError(null);setSuccess(null);
    try{
      const payload={
        action,title,description:description||null,location:location||null,
        ...facultyScheduleInstants(startsAt,endsAt,action==="RESCHEDULE"?selected:undefined),
        ...(action==="RESCHEDULE"?{
          sessionId:selected?.id,expectedUpdatedAt:selected?.updatedAt,
        }:{}),confirm:true,
      };
      const response=await fetch(
        "/api/courses/faculty/attendance/"+encodeURIComponent(deliveryId)+"/schedule",
        {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)},
      );
      if(!response.ok)throw new Error(facultyScheduleErrorMessage(await response.json().catch(()=>null)));
      setSuccess(action==="CREATE"?"Session scheduled.":"Session rescheduled.");
      router.refresh();
    }catch(e){setError(e instanceof Error?e.message:"Session update failed.");}
    finally{setBusy(false);setConfirmOpen(false);}
  }
  return <section aria-label="Faculty attendance session scheduling"
    className="space-y-3 border-t border-border pt-4">
    <h2 className="text-[16px] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">Schedule an attendance session</h2>
    <p className="text-xs text-muted-foreground">
      Times are entered in IST (Asia/Kolkata) and saved as UTC instants.
      Only sessions you scheduled and have not marked for attendance can be rescheduled.
    </p>
    <div className="grid min-w-0 grid-cols-1 gap-3 min-[768px]:grid-cols-2">
      <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Action
        <Select value={action} onChange={e=>changeAction(e.target.value as typeof action)}
          className="text-[14px]>
          <option value="CREATE">Schedule</option>
          <option value="RESCHEDULE" disabled={eligible.length===0}>Reschedule</option>
        </Select>
      </label>
      {action==="RESCHEDULE"?<label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Unmarked session
        <Select value={id} onChange={e=>{const next=eligible.find(s=>s.id===e.target.value);if(next)applyExistingSession(next);}}
          className="text-[14px]>
          {eligible.map(s=>
            <option key={s.id} value={s.id}>{s.title}</option>)}
        </Select>
      </label>:null}
      <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Session title
        <Input value={title} onChange={e=>setTitle(e.target.value)}
          maxLength={160} className="text-[14px] />
      </label>
      <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Location
        <Input value={location} onChange={e=>setLocation(e.target.value)}
          maxLength={240} className="text-[14px] />
      </label>
      <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start (IST)
        <Input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)}
          className="text-[14px] />
      </label>
      <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">End (IST)
        <Input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)}
          className="text-[14px] />
      </label>
    </div>
    <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Description
      <Textarea value={description} onChange={e=>setDescription(e.target.value)}
        maxLength={1000} className="text-[14px] />
    </label>
    <Button type="button" variant="primary" loading={busy} onClick={()=>void save()}
      disabled={busy||unchanged||action==="RESCHEDULE"&&!selected}>
      {busy?"Saving…":"Confirm "+(action==="CREATE"?"schedule":"reschedule")}
    </Button>
    <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
      title={"Confirm "+(action==="CREATE"?"schedule":"reschedule")+" this Faculty attendance session?"}
      confirmLabel={"Confirm "+(action==="CREATE"?"schedule":"reschedule")}
      confirmVariant="primary" pending={busy} onConfirm={()=>void save(true)}/>
    {unchanged?<p role="status" className="text-xs text-muted-foreground">No schedule details have changed.</p>:null}
    {error?<Alert tone="error">{error}</Alert>:null}
    {success?<Alert tone="success">{success}</Alert>:null}
  </section>;
}
