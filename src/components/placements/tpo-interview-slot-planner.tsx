"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
type Slot={id:string;startsAt:string;endsAt:string;room:string;panel:string|null;status:string;
 applicationId:string|null;version:number};
type Learner={applicationId:string;name:string|null;roll:string|null};
export function TpoInterviewSlotPlanner({jobId,roundId,slots,roster}:{
 jobId:string;roundId:string;slots:Slot[];roster:Learner[];
}){
 const router=useRouter();const [date,setDate]=useState("");const [rooms,setRooms]=useState("Room 1");
 const [minutes,setMinutes]=useState(30);const [gap,setGap]=useState(5);const [count,setCount]=useState(8);
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");
 const [pick,setPick]=useState<Record<string,string>>({});const [move,setMove]=useState<Record<string,string>>({});
 const [roomChange,setRoomChange]=useState<Record<string,string>>({});
 const url="/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(roundId)+"/interview-slots";
 async function action(body:Record<string,unknown>){
  if(busy)return;
  setBusy(true);setError("");setMessage("");
  try{const response=await fetch(url,{method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},body:JSON.stringify({...body,confirmed:true})});
   const result=await response.json() as Record<string,unknown>&{error?:string;issues?:Array<{message:string}>};
   if(!response.ok)throw Error(result.issues?.[0]?.message??result.error??"Could not update interview slots");
   setMessage("Schedule updated. "+Object.entries(result).map(([k,v])=>k+": "+String(v)).join(", "));
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Interview scheduling failed");}
  finally{setBusy(false);}
 }
 const free=slots.filter(s=>s.status==="AVAILABLE");
 const booked=slots.filter(s=>s.status==="BOOKED");
 const taken=new Set(booked.map(s=>s.applicationId));
 const waiting=roster.filter(r=>!taken.has(r.applicationId));
 const format=(iso:string)=>new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(iso))+" IST";
 return <section className="space-y-5">
  <div className="rounded-xl border border-border bg-surface p-5">
   <h2 className="font-semibold text-foreground">Generate interview day</h2>
   <p className="mt-1 text-sm text-body">Create unassigned start-time slots in each room. Existing bookings stay unchanged; overlapping room times are refused.</p>
   <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
    <label className="grid gap-1 text-sm">Start time (IST)<input type="datetime-local" required value={date} onChange={e=>setDate(e.target.value)}
      className="min-h-11 rounded border border-border bg-surface px-2"/></label>
    <label className="grid gap-1 text-sm">Room names (comma-separated)<input value={rooms} onChange={e=>setRooms(e.target.value)}
      className="min-h-11 rounded border border-border bg-surface px-2"/></label>
    <label className="grid gap-1 text-sm">Minutes per slot<input type="number" min={5} max={240} value={minutes} onChange={e=>setMinutes(Number(e.target.value))}
      className="min-h-11 rounded border border-border bg-surface px-2"/></label>
    <label className="grid gap-1 text-sm">Gap (minutes)<input type="number" min={0} max={120} value={gap} onChange={e=>setGap(Number(e.target.value))}
      className="min-h-11 rounded border border-border bg-surface px-2"/></label>
    <label className="grid gap-1 text-sm">Slots per room<input type="number" min={1} max={100} value={count} onChange={e=>setCount(Number(e.target.value))}
      className="min-h-11 rounded border border-border bg-surface px-2"/></label>
   </div>
   <div className="mt-4 flex flex-wrap gap-3">
    <button type="button" disabled={busy||!date||!rooms.trim()} onClick={()=>void action({
      action:"GENERATE_DAY",startsAt:new Date(date+"+05:30").toISOString(),durationMinutes:minutes,
      gapMinutes:gap,slotsPerRoom:count,rooms:rooms.split(",").map(v=>v.trim()).filter(Boolean),
    })} className="min-h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
     Generate day</button>
    <button type="button" disabled={busy||!free.length} onClick={()=>void action({action:"CLEAR_AVAILABLE"})}
     className="min-h-11 rounded border border-border px-4 text-sm font-semibold disabled:opacity-50">
     Clear {free.length} unbooked slot(s)</button>
   </div>
  </div>
  <div className="rounded-xl border border-border bg-surface p-5">
   <h2 className="font-semibold">Interview slots · {booked.length} booked · {free.length} available · {waiting.length} students unassigned</h2>
   <p className="mt-1 text-sm text-body">Booking, changing or cancelling a student slot sends a placement notification and records an audit event.</p>
   <div className="mt-3 space-y-3">{slots.map(slot=>{
    const student=roster.find(r=>r.applicationId===slot.applicationId);
    return <article key={slot.id} className="space-y-2 rounded border border-border bg-surface-subtle p-3">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="font-semibold text-foreground">{format(slot.startsAt)} · {slot.room}</p>
       <p className="text-sm text-body">{slot.status==="BOOKED"?(student?.name??"Assigned learner"):"Available"} · Until {format(slot.endsAt)}</p></div>
      {slot.status==="AVAILABLE"?<div className="flex flex-wrap gap-2">
       <select aria-label="Select learner for slot" value={pick[slot.id]??""} onChange={e=>setPick(p=>({...p,[slot.id]:e.target.value}))}
        className="min-h-11 rounded border border-border bg-surface px-2 text-sm">
        <option value="">Choose student</option>{waiting.map(c=><option key={c.applicationId} value={c.applicationId}>{c.roll??""} {c.name??"Learner"}</option>)}
       </select>
       <button type="button" disabled={busy||!pick[slot.id]} className="min-h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50"
        onClick={()=>void action({action:"BOOK",slotId:slot.id,expectedVersion:slot.version,applicationId:pick[slot.id]})}>Book</button>
      </div>:<div className="flex flex-wrap items-center gap-2">
       <select aria-label="Move to available slot" value={move[slot.id]??""}
        onChange={e=>setMove(p=>({...p,[slot.id]:e.target.value}))} className="min-h-11 rounded border border-border bg-surface px-2 text-sm">
        <option value="">Move to free slot</option>{free.map(target=><option key={target.id} value={target.id}>{format(target.startsAt)} · {target.room}</option>)}
       </select>
       <button type="button" disabled={busy||!move[slot.id]} className="min-h-11 rounded border border-border px-3 text-sm disabled:opacity-50"
        onClick={()=>void action({action:"MOVE",slotId:slot.id,targetSlotId:move[slot.id],expectedVersion:slot.version,reason:"Rescheduled by placement cell"})}>Move</button>
       <button type="button" disabled={busy} className="min-h-11 rounded border border-danger px-3 text-sm text-error disabled:opacity-50"
        onClick={()=>void action({action:"CANCEL",slotId:slot.id,expectedVersion:slot.version,reason:"Cancelled by placement cell"})}>Cancel</button>
      </div>}
     </div>
     <div className="flex flex-wrap items-center gap-2">
      <label className="text-sm">Change room
       <input value={roomChange[slot.id]??slot.room} onChange={e=>setRoomChange(p=>({...p,[slot.id]:e.target.value}))}
        className="ml-2 min-h-10 rounded border border-border bg-surface px-2"/></label>
      <button type="button" disabled={busy||(roomChange[slot.id]??slot.room)===slot.room}
       onClick={()=>void action({action:"ASSIGN_ROOM",slotId:slot.id,expectedVersion:slot.version,room:roomChange[slot.id]})}
       className="min-h-10 rounded border border-border px-3 text-sm disabled:opacity-50">Save room</button>
     </div>
    </article>;
   })}</div>
   {!slots.length?<p className="mt-3 text-sm text-body">No interview slots generated for this round yet.</p>:null}
  </div>
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
