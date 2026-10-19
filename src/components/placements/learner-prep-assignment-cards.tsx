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
   <ul className="space-y-2">{items.map(item=><li key={item.id} className="rounded-[var(--lms-control-radius)] border border-border p-3">
    <h3 className="font-semibold">{item.title} · {item.courseCode}</h3>
    <p className="text-sm">Due {new Date(item.dueAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST</p>
    <Link href="/learn/courses" className="text-primary-text underline">Open My Courses</Link>
   </li>)}</ul>}
 </section>;
}
