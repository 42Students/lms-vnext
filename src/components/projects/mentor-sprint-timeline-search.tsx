"use client";
import {useState} from "react";
import Link from "next/link";
import {filterMentorSprintTimeline,type MentorSprintSearchItem}
  from "@/modules/projects/mentor-sprint-timeline-search-model";

export function MentorSprintTimelineSearch({items}:{items:readonly MentorSprintSearchItem[]}){
 const [query,setQuery]=useState("");
 const results=filterMentorSprintTimeline(items,query);
 return <div className="prototype-mentor-chart-card" role="search"
   aria-label="Find a sprint, release or task">
   <label className="block font-semibold">
     Find a sprint, release or task
     <input type="search" value={query} maxLength={120}
       onChange={event=>setQuery(event.target.value)}
       placeholder="Sprint 13, release or task title"
       className="mt-2 w-full rounded border border-border bg-surface px-3 py-2"/>
   </label>
   {query.trim()?<div className="mt-3" aria-live="polite">
     <p>{results.length} matching saved {results.length===1?"item":"items"}
       {results.length===30?" (first 30)":""}</p>
     {results.length?<ul className="space-y-2">
       {results.map(item=><li key={item.kind+":"+item.id}>
         <Link href={item.href} className="text-link underline">
           <strong>{item.title}</strong>
           <span> · {item.context}</span>
           <small> · {item.kind.toLocaleLowerCase("en-IN")}</small>
         </Link>
       </li>)}
     </ul>:<p>No matching recorded sprint, release or task.</p>}
   </div>:null}
 </div>;
}
