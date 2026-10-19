import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
"use client";
import {useState,useTransition,type FormEvent} from "react";
import {useRouter} from "next/navigation";
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
  const field="min-h-11 min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground";
  return <section className="border-t border-border pt-4" aria-label="Book lecture hall">
    <h2 className="font-semibold text-foreground">Book class session</h2>
    <p className="mt-2 text-sm text-body">Dates and times use IST. A booking is only confirmed after rechecking persisted overlaps.</p>
    {classes.length===0?<p role="status">No active classes are available for booking.</p>:
      <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-1 text-sm font-semibold">Class
          <Select className={field} required value={sectionId} onChange={e=>setSectionId(e.target.value)}>
            <option value="">Select class</option>
            {classes.map(c=><option key={c.id} value={c.id}>{c.name} · {c.cohortName}</option>)}
          </Select></label>
        <label className="grid gap-1 text-sm font-semibold">Faculty (optional)
          <Select className={field} value={facultyId} onChange={e=>setFacultyId(e.target.value)}>
            <option value="">None</option>{faculty.map(f=><option key={f.id} value={f.id}>{f.displayName||"Unnamed Faculty"}</option>)}
          </Select></label>
        <label className="grid gap-1 text-sm font-semibold">Title
          <Input className={field} required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label>
        <label className="grid gap-1 text-sm font-semibold">Date (IST)
          <Input className={field} required type="date" min={selected?.periodStart} max={selected?.periodEnd}
            value={date} onChange={e=>setDate(e.target.value)}/></label>
        <label className="grid gap-1 text-sm font-semibold">Starts (IST)
          <Input className={field} required type="time" value={from} onChange={e=>setFrom(e.target.value)}/></label>
        <label className="grid gap-1 text-sm font-semibold">Ends (IST)
          <Input className={field} required type="time" value={to} onChange={e=>setTo(e.target.value)}/></label>
        <div className="sm:col-span-2 lg:col-span-3">
          <button type="submit" disabled={pending||!sectionId||!title.trim()}
            className="min-h-11 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
            {pending?"Booking…":"Confirm booking"}</button>
        </div>
      </form>}
    {error?<p role="alert" className="mt-2 text-sm text-error">{error}</p>:null}
    {notice?<p role="status" className="mt-2 text-sm text-success">{notice}</p>:null}
  </section>;
}
