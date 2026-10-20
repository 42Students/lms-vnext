"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
type Prep={id:string;offeringId:string;title:string;courseCode:string;dueAt:string};
export function LearnerPrepAssignmentCards(){
 const [items,setItems]=useState<Prep[]>([]),[error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;void Promise.resolve().then(async()=>{
  try{const data=await apiFetch<{assignments:Prep[]}>("/api/placements/requests/prep",{cache:"no-store"});
   if(active)setItems(data.assignments);
  }catch{if(active)setError("Assigned preparation courses could not be loaded. Your recorded preparation checklist is unaffected.");}
  finally{if(active)setLoading(false);}
 });return ()=>{active=false;};},[]);
 return <section aria-label="Assigned preparation" className="space-y-3 border-b border-border pb-5">
  <h2 className="font-semibold">Assigned preparation</h2>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {loading?<p role="status" className="text-sm text-body">Loading assigned preparation…</p>:
   !items.length&&!error?<p className="text-sm">No preparation courses assigned yet.</p>:
   !items.length?null:
   <ul className="divide-y divide-border">{items.map(item=><li key={item.id} className="min-w-0 py-3 first:pt-0 last:pb-0 md:py-4">
    <h3 className="break-words font-semibold">{item.title} · {item.courseCode}</h3>
    <p className="text-sm">Due {new Date(item.dueAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST</p>
    <Link href="/learn/courses" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Open My Courses</Link>
   </li>)}</ul>}
 </section>;
}
