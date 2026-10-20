"use client";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import {useState,useTransition,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
type Classroom={id:string;name:string;cohortName:string;periodStart:string;periodEnd:string;updatedAt:string};
type Faculty={id:string;displayName:string|null};
export function CollegeHallBookingAction({hallId,classes,faculty}:{
  hallId:string;classes:Classroom[];faculty:Faculty[];
}){
  const router=useRouter(),[pending,start]=useTransition();
  const [sectionId,setSectionId]=useState(""),[facultyId,setFacultyId]=useState("");
  const [date,setDate]=useState(""),[from,setFrom]=useState("09:00"),[to,setTo]=useState("10:00");
  const [title,setTitle]=useState("Class session"),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const selected=classes.find(row=>row.id===sectionId);
  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!selected)return;
    if(!window.confirm("Book this class session? All hall, class and Faculty overlaps will be rechecked."))return;
    setError("");setNotice("");
    start(async()=>{
      try{
        const response=await fetch("/api/college/lecture-halls/"+encodeURIComponent(hallId)+"/bookings",{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({sectionId,facultyMembershipId:facultyId||null,date,from,to,title,
            expectedSectionUpdatedAt:selected.updatedAt,confirm:true}),
        });
        if(!response.ok){
          const result=await response.json().catch(()=>({error:"HALL_BOOKING_FAILED"})) as {error?:string};
          throw new Error(result.error??"HALL_BOOKING_FAILED");
        }
        setNotice("Session booked and audited.");router.refresh();
      }catch(reason){setError(reason instanceof Error?reason.message:"Booking failed");}
    });
  }
  const field="min-h-11 md:min-h-9 min-w-0";
  return <section className="min-w-0 border-t border-border pt-3" aria-label="Book lecture hall">
    <details className="min-w-0">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Book class session</summary>
      <div className="min-w-0 space-y-3 pt-3">
    <p className="mt-2 text-sm text-body">Dates and times use IST. A booking is only confirmed after rechecking persisted overlaps.</p>
    {classes.length===0?<p role="status">No active classes are available for booking.</p>:
      <form onSubmit={submit} className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 min-[992px]:grid-cols-3">
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class
          <Select className={field} required value={sectionId} onChange={e=>setSectionId(e.target.value)}>
            <option value="">Select class</option>
            {classes.map(c=><option key={c.id} value={c.id}>{c.name} · {c.cohortName}</option>)}
          </Select></label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty (optional)
          <Select className={field} value={facultyId} onChange={e=>setFacultyId(e.target.value)}>
            <option value="">None</option>{faculty.map(f=><option key={f.id} value={f.id}>{f.displayName||"Unnamed Faculty"}</option>)}
          </Select></label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title
          <Input className={field} required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Date (IST)
          <DateInput className={field} required mode="date" min={selected?.periodStart} max={selected?.periodEnd}
            value={date} onChange={e=>setDate(e.target.value)}/></label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Starts (IST)
          <DateInput className={field} required mode="time" value={from} onChange={e=>setFrom(e.target.value)}/></label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Ends (IST)
          <DateInput className={field} required mode="time" value={to} onChange={e=>setTo(e.target.value)}/></label>
        <div className="md:col-span-2 min-[992px]:col-span-3">
          <Button variant="primary" type="submit" loading={pending} className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={pending||!sectionId||!title.trim()}>
            {pending?"Booking…":"Confirm booking"}</Button>
        </div>
      </form>}
    {error?<p role="alert" className="mt-2 text-sm text-error">{error}</p>:null}
    {notice?<p role="status" className="mt-2 text-sm text-success">{notice}</p>:null}
      </div>
    </details>
  </section>;
}
