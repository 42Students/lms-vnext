"use client";
import {useState,useTransition} from "react";
import { StatTile } from "@/components/ui/stat-tile";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import type { getCollegeDashboardCards } from "@/modules/admin-ui/college-dashboard-cards-service";
import {
  COLLEGE_AT_A_GLANCE_HEADING,
  COLLEGE_AT_A_GLANCE_KEYS,
} from "@/modules/admin-ui/college-dashboard-cards-model";

type Cards = Awaited<ReturnType<typeof getCollegeDashboardCards>>["cards"];

export function CollegeDashboardCards({ cards }: { cards: Cards }) {
  const visible = COLLEGE_AT_A_GLANCE_KEYS
    .map(key => cards.find(card => card.key === key))
    .filter((card): card is Cards[number] => Boolean(card));
  const icons:Record<string,string>={
    students:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
    faculty:"M7 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM1 21a6 6 0 0 1 12 0M17 5a4 4 0 0 1 0 8m-2 3a6 6 0 0 1 8 5",
    "course-list":"M4 3h15v17H6a2 2 0 0 1-2-2V3Zm0 14c0-1 1-2 2-2h13M8 7h7M8 11h7",
    jobs:"M4 7h16v14H4zM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 13a22 22 0 0 0 16 0",
  };
  const [counts,setCounts]=useState<Record<string,number|null>>(()=>Object.fromEntries(visible.map(card=>[card.key,card.count])));
  const [error,setError]=useState(false);
  const [pending,startTransition]=useTransition();
  const refresh=()=>startTransition(async()=>{
   try{
    const response=await fetch("/api/college/summary",{credentials:"same-origin",cache:"no-store"});
    if(!response.ok)throw new Error("Summary refresh failed");
    const result:unknown=await response.json();
    if(!result||typeof result!=="object"||!("data" in result)||!result.data||typeof result.data!=="object")
     throw new Error("Missing summary");
    const data=result.data as Record<string,unknown>;
    const keys:[string,string][]=[["students","studentCount"],["faculty","facultyCount"],
     ["course-list","courseCount"],["jobs","activeDriveCount"]];
    const next:Record<string,number|null>={};
    for(const [key,source]of keys){
     const value=data[source];
     if(value!==null&&(typeof value!=="number"||!Number.isSafeInteger(value)||value<0))
      throw new Error("Invalid summary count");
     next[key]=value;
    }
    setCounts(next);setError(false);
   }catch{setError(true);}
  });
  return <section className="space-y-4" aria-label={COLLEGE_AT_A_GLANCE_HEADING}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold text-foreground">{COLLEGE_AT_A_GLANCE_HEADING}</h2>
      <Button type="button" variant="secondary" disabled={pending} onClick={refresh}
       className="min-h-11 md:min-h-9">{pending?"Refreshing…":"Retry / Refresh"}</Button>
    </div>
    {error?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm">Summary refresh failed. Showing the last successful college totals.</p>:null}
    {visible.length ? <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
      {visible.map(card => <StatTile key={card.key} variant="college" href={card.href}
        label={card.label} value={counts[card.key]??"—"}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none"
         stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
         className="mt-2 block text-primary-text"><path d={icons[card.key]??icons.students}/></svg>
       </StatTile>)}
    </div> : <div className="space-y-2">
      <EmptyState title="No college summary available" description="College summary metrics are not available in the selected scope."/>
      <p role="status" className="text-sm text-muted-foreground">Couldn't refresh college summary. Previous counts are not assumed to be zero.</p>
      <Link href="/college" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>
    </div>}
  </section>;
}
