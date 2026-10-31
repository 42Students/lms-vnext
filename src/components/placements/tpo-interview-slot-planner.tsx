"use client";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {EmptyState} from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
type Slot={id:string;startsAt:string;endsAt:string;room:string;panel:string|null;status:string;
 applicationId:string|null;version:number};
type Learner={applicationId:string;name:string|null;roll:string|null};
type Reschedule={id:string;applicationId:string|null;name:string|null;reason:string;requestedAt:string};
type Proposal={id:string;startsAt:string;endsAt:string;mode:string;meetingLocation:string|null;panelLabel:string|null;version:number};
export function TpoInterviewSlotPlanner({jobId,roundId,slots,roster,recruiterProposals,reschedules}:{
 jobId:string;roundId:string;slots:Slot[];roster:Learner[];recruiterProposals:Proposal[];reschedules:Reschedule[];
}){
 const router=useRouter();const [date,setDate]=useState("");const [rooms,setRooms]=useState("Room 1");
 const [minutes,setMinutes]=useState(30);const [gap,setGap]=useState(5);const [count,setCount]=useState(8);
 const [busy,setBusy]=useState(false);const busyRef=useRef(false);const [error,setError]=useState("");const [message,setMessage]=useState("");
 const [pick,setPick]=useState<Record<string,string>>({});const [move,setMove]=useState<Record<string,string>>({});
 const [roomChange,setRoomChange]=useState<Record<string,string>>({});
 const [fromRoll,setFromRoll]=useState("");const [toRoll,setToRoll]=useState("");
 const [bulkRoom,setBulkRoom]=useState("");
 const [venue,setVenue]=useState<Record<string,string>>({});
 const [requestTarget,setRequestTarget]=useState<Record<string,string>>({});
 const [requestReason,setRequestReason]=useState<Record<string,string>>({});
 const [confirmRequest,setConfirmRequest]=useState<{title:string;description:string;body:Record<string,unknown>}|null>(null);
 const url="/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(roundId)+"/interview-slots";
 async function action(body:Record<string,unknown>){
  if(busyRef.current||busy)return;
  busyRef.current=true;
  setBusy(true);setError("");setMessage("");
  try{const response=await fetch(url,{method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},body:JSON.stringify({...body,confirmed:true})});
   await response.json();
   if(!response.ok)throw Error("Could not update interview slots. Refresh and review the schedule.");
   setMessage("Schedule updated.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Interview scheduling failed");}
  finally{busyRef.current=false;setBusy(false);}
 }
 const free=slots.filter(s=>s.status==="AVAILABLE");
 const booked=slots.filter(s=>s.status==="BOOKED");
 const taken=new Set(booked.map(s=>s.applicationId));
 const waiting=roster.filter(r=>!taken.has(r.applicationId));
 const format=(iso:string)=>new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(iso))+" IST";
 return <section className="min-w-0 space-y-4">
  {error?<InlineNotice tone="error" message={error}/>:null}
  {message?<InlineNotice tone="success" message={message}/>:null}
  {reschedules.length?<section className="space-y-3 border-b border-border pb-6">
   <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Pending reschedule requests · {reschedules.length}</h2>
   <p className="text-sm text-body leading-[22px]">Move a learner to an available slot, or Keep the current booking and answer the request. Decisions and student notifications are recorded.</p>
   {reschedules.map(req=><div key={req.id} className="space-y-3 border-b border-border py-4">
    <p className="min-w-0 break-words text-sm leading-[22px]"><strong>{req.name??"Learner"}</strong> · {req.reason}</p>
    <div className="flex flex-wrap gap-3">
     <Select value={requestTarget[req.id]??""} aria-label={"New slot for "+(req.name??"learner")}
      onChange={e=>setRequestTarget(p=>({...p,[req.id]:e.target.value}))}
      className="min-h-11 w-full min-w-0 sm:flex-1 md:min-h-9 text-sm">
      <option value="">Choose new slot</option>
      {free.map(slot=><option key={slot.id} value={slot.id}>{format(slot.startsAt)} · {slot.room}</option>)}
     </Select>
     <Input placeholder="Decision reason" aria-label={"Reason for "+(req.name??"learner")}
      value={requestReason[req.id]??""} onChange={e=>setRequestReason(p=>({...p,[req.id]:e.target.value}))}
      className="min-h-11 w-full min-w-0 sm:flex-1 md:min-h-9 text-sm"/>
    </div>
    <div className="flex flex-wrap gap-3">
     <Button variant="primary" type="button" disabled={busy||!requestTarget[req.id]||(requestReason[req.id]??"").trim().length<3}
      onClick={()=>void action({action:"MOVE_REQUEST",requestId:req.id,targetSlotId:requestTarget[req.id],
       reason:(requestReason[req.id]??"").trim()})}
      className="min-h-11 w-full sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary disabled:opacity-50">Move</Button>
     <Button variant="secondary" type="button" disabled={busy||(requestReason[req.id]??"").trim().length<3}
      onClick={()=>void action({action:"KEEP_REQUEST",requestId:req.id,reason:(requestReason[req.id]??"").trim()})}
      className="min-h-11 w-full sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] disabled:opacity-50">Keep existing slot</Button>
    </div>
   </div>)}
  </section>:null}
  {recruiterProposals.length?<div className="min-w-0 space-y-3 border-y border-border py-4">
   <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Recruiter-proposed interview slots</h2>
   {recruiterProposals.map(p=><div key={p.id} className="grid min-w-0 gap-3 border-b border-border py-3 sm:grid-cols-2">
    <p className="text-sm leading-[22px]">{format(p.startsAt)} · {p.mode} · {p.panelLabel??"Recruiter panel"}</p>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Venue or meeting link
     <Input value={venue[p.id]??p.meetingLocation??""} onChange={e=>setVenue(v=>({...v,[p.id]:e.target.value}))}
      className="min-h-11 w-full min-w-0 md:min-h-9"/>
    </label>
    <Button variant="primary" type="button" disabled={busy||!(venue[p.id]??p.meetingLocation??"").trim()}
     onClick={()=>void action({action:"CONFIRM_RECRUITER_PROPOSAL",proposalId:p.id,expectedVersion:p.version,
      venue:(venue[p.id]??p.meetingLocation??"").trim()})}
     className="min-h-11 w-full sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] disabled:opacity-50 text-on-primary">
     Confirm recruiter proposal
    </Button>
   </div>)}
  </div>:null}
  <details open={slots.length===0} className="group min-w-0 border-t border-border pt-4">
   <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Interview day setup</summary>
  <div className="min-w-0 border-t border-border pt-4">
   <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Generate interview day</h2>
   <p className="mt-1 text-sm text-body leading-[22px]">Create unassigned start-time slots in each room. Existing bookings stay unchanged; overlapping room times are refused.</p>
   <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start time (IST)<Input type="datetime-local" required value={date} onChange={e=>setDate(e.target.value)}
      className="min-h-11 w-full min-w-0 md:min-h-9"/></label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Room names (comma-separated)<Input value={rooms} onChange={e=>setRooms(e.target.value)}
      className="min-h-11 w-full min-w-0 md:min-h-9"/></label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minutes per slot<Input type="number" min={5} max={240} value={minutes} onChange={e=>setMinutes(Number(e.target.value))}
      className="min-h-11 w-full min-w-0 md:min-h-9"/></label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Gap (minutes)<Input type="number" min={0} max={120} value={gap} onChange={e=>setGap(Number(e.target.value))}
      className="min-h-11 w-full min-w-0 md:min-h-9"/></label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Slots per room<Input type="number" min={1} max={100} value={count} onChange={e=>setCount(Number(e.target.value))}
      className="min-h-11 md:min-h-9 "/></label>
   </div>
   <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
    <Button variant="primary" type="button" disabled={busy||!date||!rooms.trim()} onClick={()=>void action({
      action:"GENERATE_DAY",startsAt:new Date(date+"+05:30").toISOString(),durationMinutes:minutes,
      gapMinutes:gap,slotsPerRoom:count,rooms:rooms.split(",").map(v=>v.trim()).filter(Boolean),
    })} className="min-h-11 w-full sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] disabled:opacity-50 text-on-primary">
     Generate day</Button>
    <Button variant="secondary" type="button" disabled={busy||!free.length} onClick={()=>setConfirmRequest({title:"Remove "+free.length+" unbooked interview slots?",description:"Existing bookings stay unchanged.",body:{action:"CLEAR_AVAILABLE"}})}
     className="min-h-11 w-full sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] disabled:opacity-50">
     Clear {free.length} unbooked slot(s)</Button>
   </div>
  </div>
  <details className="group min-w-0 border-t border-border pt-3">
   <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">Assign rooms by roll range <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span></summary>
   <p className="mt-1 text-sm text-body leading-[22px]">Preview the affected roll range, then assign a room. Overlapping room bookings are skipped and reported.</p>
   <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">From roll<Input value={fromRoll} onChange={e=>setFromRoll(e.target.value)}
     className="min-h-11 md:min-h-9 "/></label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">To roll<Input value={toRoll} onChange={e=>setToRoll(e.target.value)}
     className="min-h-11 md:min-h-9 "/></label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">New room<Input value={bulkRoom} onChange={e=>setBulkRoom(e.target.value)}
     className="min-h-11 md:min-h-9 "/></label>
   </div>
   {fromRoll&&toRoll&&fromRoll.localeCompare(toRoll,"en",{numeric:true})>0?<InlineNotice tone="error" message="The ending roll must be after the starting roll."/>:null}
   {fromRoll&&toRoll?<p role="status" className="mt-3 text-sm leading-[22px]">
    {roster.filter(r=>r.roll&&r.roll.localeCompare(fromRoll,"en",{numeric:true})>=0&&
     r.roll.localeCompare(toRoll,"en",{numeric:true})<=0&&taken.has(r.applicationId)).length} booked students in the requested roll range.
   </p>:null}
   <Button variant="secondary" type="button" disabled={busy||!fromRoll||!toRoll||!bulkRoom||fromRoll.localeCompare(toRoll,"en",{numeric:true})>0} onClick={()=>setConfirmRequest({title:"Change rooms for booked learners in roll range "+fromRoll+" to "+toRoll+"?",description:"Collision checks will skip blocked moves.",body:{action:"ASSIGN_ROOMS_BY_ROLL",fromRoll,toRoll,room:bulkRoom}})} className="mt-3 min-h-11 w-full sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] border border-primary px-4 text-sm font-[650] text-[var(--lms-teal-deep)] disabled:opacity-50">
    Previewed · Assign room
   </Button>
  </details>
  </details>
  <div className="min-w-0 border-t border-border pt-4">
   <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Interview slots · {booked.length} booked · {free.length} available · {waiting.length} students unassigned</h2>
   <p className="mt-1 text-sm text-body leading-[22px]">Booking, changing or cancelling a student slot sends a placement notification and records an audit event.</p>
   <div className="mt-3 min-w-0 divide-y divide-border">{slots.map(slot=>{
    const student=roster.find(r=>r.applicationId===slot.applicationId);
    return <article key={slot.id} className="min-w-0 space-y-2 py-4">
     <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div><p className="font-semibold text-foreground">{format(slot.startsAt)} · {slot.room}</p>
       <p className="text-sm text-body leading-[22px]">{slot.status==="BOOKED"?(student?.name??"Assigned learner"):"Available"} · Until {format(slot.endsAt)}</p></div>
      {slot.status==="AVAILABLE"?<div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
       <Select aria-label="Select learner for slot" value={pick[slot.id]??""} onChange={e=>setPick(p=>({...p,[slot.id]:e.target.value}))}
        className="min-h-11 w-full min-w-0 sm:w-auto md:min-h-9 text-sm">
        <option value="">Choose student</option>{waiting.map(c=><option key={c.applicationId} value={c.applicationId}>{c.roll??""} {c.name??"Learner"}</option>)}
       </Select>
       <Button variant="primary" type="button" disabled={busy||!pick[slot.id]} className="min-h-11 w-full sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] disabled:opacity-50 text-on-primary"
        onClick={()=>void action({action:"BOOK",slotId:slot.id,expectedVersion:slot.version,applicationId:pick[slot.id]})}>Book</Button>
      </div>:<div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
       <Select aria-label="Move to available slot" value={move[slot.id]??""}
        onChange={e=>setMove(p=>({...p,[slot.id]:e.target.value}))} className="min-h-11 w-full min-w-0 sm:w-auto md:min-h-9 text-sm">
        <option value="">Move to free slot</option>{free.map(target=><option key={target.id} value={target.id}>{format(target.startsAt)} · {target.room}</option>)}
       </Select>
       <Button variant="secondary" type="button" disabled={busy||!move[slot.id]} className="min-h-11 w-full sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm disabled:opacity-50"
        onClick={()=>void action({action:"MOVE",slotId:slot.id,targetSlotId:move[slot.id],expectedVersion:slot.version,reason:"Rescheduled by placement cell"})}>Move</Button>
       <Button variant="secondary" type="button" disabled={busy} className="min-h-11 w-full sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] border border-danger px-3 text-sm text-foreground disabled:opacity-50"
        onClick={()=>setConfirmRequest({title:"Cancel booked interview slot?",description:"Booking, changing or cancelling a student slot sends a placement notification and records an audit event.",body:{action:"CANCEL",slotId:slot.id,expectedVersion:slot.version,reason:"Cancelled by placement cell"}})}>Cancel</Button>
      </div>}
     </div>
     <details className="group min-w-0 border-t border-border pt-2">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">Change room <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span></summary>
      <div className="flex min-w-0 flex-col gap-2 pt-2 sm:flex-row sm:items-end">
      <label className="min-w-0 flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Change room
       <Input value={roomChange[slot.id]??slot.room} onChange={e=>setRoomChange(p=>({...p,[slot.id]:e.target.value}))}
        className="mt-1 min-h-11 w-full min-w-0 md:min-h-9"/></label>
      <Button variant="secondary" type="button" disabled={busy||(roomChange[slot.id]??slot.room)===slot.room}
       onClick={()=>void action({action:"ASSIGN_ROOM",slotId:slot.id,expectedVersion:slot.version,room:roomChange[slot.id]})}
       className="min-h-11 w-full sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm disabled:opacity-50">Save room</Button>
      </div>
     </details>
    </article>;
   })}</div>
   {!slots.length?<EmptyState title="No interview slots generated for this round yet."/>:null}
  </div>
  <ConfirmDialog open={confirmRequest!==null}
    onOpenChange={next=>{if(!next&&!busy)setConfirmRequest(null);}}
    pending={busy}
    title={confirmRequest?.title??"Confirm schedule change"}
    {...(confirmRequest?.description !== undefined ? {description:confirmRequest.description} : {})}
    confirmLabel="Confirm"
    onConfirm={()=>{if(confirmRequest){const body=confirmRequest.body;setConfirmRequest(null);void action(body);}}}/>
 </section>;
}
