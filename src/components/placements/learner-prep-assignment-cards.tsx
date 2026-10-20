"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
type Prep={id:string;offeringId:string;title:string;courseCode:string;dueAt:string};
export function LearnerPrepAssignmentCards(){
 const [items,setItems]=useState<Prep[]>([]),[error,setError]=useState("");
 useEffect(()=>{void Promise.resolve().then(async()=>{
  try{const data=await apiFetch<{assignments:Prep[]}>("/api/placements/requests/prep",{cache:"no-store"});
   setItems(data.assignments);
  }catch{setError("Assigned preparation courses could not be loaded. Your recorded preparation checklist is unaffected.");}
 });},[]);
 return <section aria-label="Assigned preparation" className="space-y-3 border-b border-border pb-5">
  <h2 className="font-semibold">Assigned preparation</h2>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {!items.length?<p className="text-sm">No preparation courses assigned yet.</p>:
   <ul className="space-y-2">{items.map(item=><li key={item.id} className="min-w-0 rounded-xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(38,186,199,0.25)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--lms-primary)] motion-reduce:transition-none md:p-6">
    <h3 className="font-semibold">{item.title} · {item.courseCode}</h3>
    <p className="text-sm">Due {new Date(item.dueAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST</p>
    <Link href="/learn/courses" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Open My Courses</Link>
   </li>)}</ul>}
 </section>;
}
