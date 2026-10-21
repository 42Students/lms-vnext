"use client";
import {useState,useTransition} from "react";
import { StatTile } from "@/components/ui/stat-tile";
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
  const icons:Record<string,string>={students:"♙",faculty:"♙","course-list":"▤",jobs:"▣"};
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
      <button type="button" disabled={pending} onClick={refresh}
       className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">{pending?"Refreshing…":"Retry / Refresh"}</button>
    </div>
    {error?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm">Summary refresh failed. Showing the last successful college totals.</p>:null}
    {visible.length ? <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
      {visible.map(card => <StatTile key={card.key} variant="college" href={card.href}
        label={card.label} value={counts[card.key]??"—"}>
        <span aria-hidden="true" className="mt-2 block text-lg text-primary-text">
         {icons[card.key]??"•"}
        </span>
       </StatTile>)}
    </div> : <div className="space-y-2">
      <EmptyState title="No college summary available" description="College summary metrics are not available in the selected scope."/>
      <p role="status" className="text-sm text-muted-foreground">Couldn't refresh college summary. Previous counts are not assumed to be zero.</p>
      <Link href="/college" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>
    </div>}
  </section>;
}
