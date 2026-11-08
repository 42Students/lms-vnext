"use client";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import {useRef,useState,useTransition,type FormEvent} from "react";
import {useConfirmFlow} from "@/components/ui/use-confirm-flow";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
type Classroom={id:string;name:string;cohortName:string;periodStart:string;periodEnd:string;updatedAt:string};
type Faculty={id:string;displayName:string|null};
export function CollegeHallBookingAction({hallId,classes,faculty}:{
  hallId:string;classes:Classroom[];faculty:Faculty[];
}){
  const router=useRouter(),[pending,start]=useTransition();
  const {askConfirm,dialog}=useConfirmFlow();
  const pendingRef=useRef(false);
  const [sectionId,setSectionId]=useState(""),[facultyId,setFacultyId]=useState("");
  const [date,setDate]=useState(""),[from,setFrom]=useState("09:00"),[to,setTo]=useState("10:00");
  const [title,setTitle]=useState("Class session"),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const selected=classes.find(row=>row.id===sectionId);
  const invalidWindow=Boolean(from && to && to<=from);
  const invalidDate=Boolean(date && selected &&
    (date<selected.periodStart || date>selected.periodEnd));
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!selected||pendingRef.current||pending)return;
    if(invalidWindow||invalidDate){
      setError(invalidWindow ? "End time must be after start time." :
        "Choose a date within the selected class academic period.");
      return;
    }
    if(!(await askConfirm("Book this class session? All hall, class and Faculty overlaps will be rechecked.")))return;
    if(pendingRef.current)return;
    pendingRef.current=true;
    setError("");setNotice("");
    start(async()=>{
      try{
        const response=await fetch("/api/college/lecture-halls/"+encodeURIComponent(hallId)+"/bookings",{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({sectionId,facultyMembershipId:facultyId||null,date,from,to,title,
            expectedSectionUpdatedAt:selected.updatedAt,confirm:true}),
        });
        if(!response.ok)throw new Error("Booking could not be saved. Check hall, class and Faculty availability before retrying.");
        setNotice("Session booked and audited.");router.refresh();
      }catch{setError("Booking could not be saved. Check hall, class and Faculty availability before retrying.");}
      finally{pendingRef.current=false;}
    });
  }
  const field="min-h-11 md:min-h-9 min-w-0";
  return <section className="min-w-0 border-t border-border pt-3" aria-label="Book lecture hall">
    <Disclosure title="Book class session" className="min-w-0">
      <div className="min-w-0 space-y-3 pt-3">
    <p className="mt-2 text-sm text-body">Dates and times use IST. A booking is only confirmed after rechecking persisted overlaps.</p>
    {classes.length===0?<p role="status">No active classes are available for booking.</p>:
      <form onSubmit={submit} className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Label stack>Class
          <Select className={field} required value={sectionId} onChange={e=>{
            setSectionId(e.target.value);setDate("");setError("");setNotice("");
          }}>
            <option value="">Select class</option>
            {classes.map(c=><option key={c.id} value={c.id}>{c.name} · {c.cohortName}</option>)}
          </Select></Label>
        <Label stack>Faculty (optional)
          <Select className={field} value={facultyId} onChange={e=>setFacultyId(e.target.value)}>
            <option value="">None</option>{faculty.map(f=><option key={f.id} value={f.id}>{f.displayName||"Unnamed Faculty"}</option>)}
          </Select></Label>
        <Label stack>Title
          <Input className={field} required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></Label>
        <Label stack>Date (IST)
          <DateInput className={field} required mode="date" min={selected?.periodStart} max={selected?.periodEnd}
            value={date} onChange={e=>setDate(e.target.value)}/></Label>
        <Label stack>Starts (IST)
          <DateInput className={field} required mode="time" value={from} onChange={e=>setFrom(e.target.value)}/></Label>
        <Label stack>Ends (IST)
          <DateInput className={field} required mode="time" value={to} onChange={e=>setTo(e.target.value)}/></Label>
        {invalidWindow?<p role="alert" className="text-sm text-error md:col-span-2 lg:col-span-3">End time must be after start time.</p>:null}
        {invalidDate?<p role="alert" className="text-sm text-error md:col-span-2 lg:col-span-3">Choose a date within the selected class academic period.</p>:null}
        <div className="md:col-span-2 lg:col-span-3">
          <Button variant="primary" type="submit" loading={pending} className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={pending||!sectionId||!date||!title.trim()||invalidWindow||invalidDate}>
            {pending?"Booking…":"Confirm booking"}</Button>
        </div>
      </form>}
    {error?<p role="alert" className="mt-2 text-sm text-error">{error}</p>:null}
    {notice?<p role="status" className="mt-2 text-sm text-success">{notice}</p>:null}
      </div>
    </Disclosure>
    {dialog}
  </section>;
}
