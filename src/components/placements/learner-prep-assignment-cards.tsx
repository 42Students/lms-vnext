"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import { Heading } from "@/components/ui/heading";
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
  <Heading level={2} size="base" className="leading-[26px] md:text-[18px] md:leading-7 lg:text-[20px] lg:leading-[30px] text-[var(--lms-heading)]">Assigned preparation</Heading>
  {error?<p role="alert" className="text-sm text-error leading-[22px]">{error}</p>:null}
  {loading?<p role="status" className="text-sm text-body leading-[22px]">Loading assigned preparation…</p>:
   !items.length&&!error?<p className="text-sm leading-[22px]">No preparation courses assigned yet.</p>:
   !items.length?null:
   <ul className="divide-y divide-border">{items.map(item=><li key={item.id} className="min-w-0 py-3 first:pt-0 last:pb-0 md:py-4">
    <Heading level={3} className="break-words">{item.title} · {item.courseCode}</Heading>
    <p className="text-sm leading-[22px]">Due {new Date(item.dueAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST</p>
    <Link href="/learn/courses" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Open My Courses</Link>
   </li>)}</ul>}
 </section>;
}
