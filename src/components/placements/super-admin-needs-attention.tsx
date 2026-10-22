"use client";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {useState} from "react";
type Attention={code:string;jobId:string;jobTitle:string;companyName:string;count:number;priority:string;detail?:string|null;learnerName?:string|null};
type CategoryRead={code:string;affected:number;jobs:number;samples:readonly Attention[];sampleBasis?:"learners"|"drives"};
const categories=[
 {code:"STALE_APPLICATIONS",label:"Applications with no action in a week",tab:"APPLIED"},
 {code:"INTERVIEW_UNSCHEDULED",label:"Marked Interview, nothing scheduled",tab:"INTERVIEW"},
 {code:"OFFERED_NO_LETTER",label:"Offered, no offer letter attached",tab:"ALL"},
 {code:"CLOSING_SOON_LOW_CONVERSION",label:"Closing soon, low conversion",tab:null},
] as const;
export function SuperAdminNeedsAttention({items,basePath,summary,available=true,loading=false}:{
 items:readonly Attention[];basePath:string;summary?:readonly CategoryRead[];available?:boolean;loading?:boolean;
}){
 const [expanded,setExpanded]=useState<string[]>([]);
 const active=categories.map(category=>{
  const facts=summary?.find(fact=>fact.code===category.code);
  const rows=facts?.samples??items.filter(item=>item.code===category.code);
  const affected=facts?.affected??rows.reduce((n,item)=>n+Math.max(0,item.count),0);
  return {...category,rows,affected,distinctDrives:facts?.jobs??rows.length,
   sampleBasis:facts?.sampleBasis??"drives"};
 });
 const total=active.reduce((n,category)=>n+category.affected,0);
 if(loading)return <section aria-label="Needs attention" role="status" className="rounded-[var(--lms-canvas-radius)] border border-border p-4">
  <p className="text-sm font-semibold">Checking drives that need attention</p>
  <div className="mt-3 animate-pulse space-y-3" aria-hidden="true">{[0,1,2].map(i=><div key={i} className="h-7 rounded bg-surface-secondary"/>)}</div>
 </section>;
 if(!available)return <section aria-label="Needs attention" role="alert" className="flex flex-wrap items-center gap-3 rounded-[var(--lms-canvas-radius)] border border-error bg-[var(--lms-error-subtle)] p-4 text-sm">
  <span>Couldn't check for anything that needs attention.</span>
  <Link href={basePath} className="min-h-9 font-semibold text-link underline">Retry</Link>
 </section>;
 if(total===0)return <section role="status" aria-label="Needs attention"
   className="flex items-center gap-2 rounded-[var(--lms-canvas-radius)] border border-success bg-[var(--lms-success-subtle)] p-4 text-sm text-success">
   <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>
   No drives currently flagged in this view.
  </section>;
 return <section aria-label="Needs attention" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[#faad14] border-l-4 border-l-[#faad14] bg-[#fff1b8] px-4 py-3 shadow-[0_1px_4px_rgba(250,173,20,0.25)]">
  <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[#613400]">
   <svg aria-hidden="true" className="size-4 text-[#ad6800]" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none"><path d="M10.3 3.8 1.8 18.5a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v5m0 3v.2"/></svg>
   Needs attention ({total})
  </h2>
  <div className="mt-3 space-y-3">
   {active.filter(category=>category.affected>0).map(category=>{
    const shown=expanded.includes(category.code)?category.rows:category.rows.slice(0,3);
    const incomplete=category.sampleBasis==="learners"?category.affected>category.rows.length:
     category.distinctDrives>category.rows.length;
    return <div key={category.code} className="min-w-0 space-y-1">
     <h3 className="text-[13px] font-semibold text-[#613400]">{category.label} ({category.affected})</h3>
     <div className="space-y-1">{shown.map((item,index)=>{
       const params=new URLSearchParams();
       if(category.tab!==null)params.set("stage",category.tab);
       if(category.code!=="CLOSING_SOON_LOW_CONVERSION")
        params.set("attention",category.code);
       // Application filters are server-side tenant-scoped. A candidate name
       // narrows the pre-existing stage+attention filter without exposing IDs.
       if(item.learnerName)params.set("q",item.learnerName);
       // The applicant list validates this relative path before using it as
       // a contextual Back link; no cross-college data comes from the URL.
       params.set("returnTo",basePath);
       const href=basePath+"/jobs/"+encodeURIComponent(item.jobId)+
        (category.tab===null?"":"/applications?"+params.toString());
       return <Link key={item.jobId+"-"+index} href={href}
        aria-label={(item.learnerName?item.learnerName+", ":"")+item.jobTitle+", "+category.label+", "+item.count+" affected"}
        className="flex min-h-11 md:min-h-[var(--lms-control-height)] min-w-0 items-center justify-between gap-3 rounded px-1 py-1 text-[13px] text-[#613400] hover:bg-[#ffe58f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ad6800]">
        <span className="min-w-0 truncate">{item.learnerName?<strong className="font-semibold">{item.learnerName} · </strong>:null}{item.companyName?item.companyName+" — ":""}{item.jobTitle}</span>
        <span className="flex shrink-0 items-center gap-1 text-xs text-[#8c6a35]">{item.detail??item.count+" affected"}
         <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
        </span>
       </Link>;
      })}</div>
     {category.rows.length>3?<Button variant="ghost" type="button" size="sm"
      onClick={()=>setExpanded(previous=>previous.includes(category.code)?previous.filter(x=>x!==category.code):[...previous,category.code])}>
      {expanded.includes(category.code)?"Show less":"+"+(category.rows.length-shown.length)+" more"}
     </Button>:null}
     {incomplete?<div className="flex flex-wrap items-center gap-3 text-xs text-[#8c6a35]">
       <p role="status">{category.sampleBasis==="learners"?
         <>Showing top {shown.length} of {category.affected} affected candidate records across {category.distinctDrives} flagged drives.</>:
         <>Showing top {shown.length} of {category.distinctDrives} flagged drives ({category.affected} affected records across the category).</>}
        {" "}Open a drive to review all matching candidates.</p>
       <Link href={basePath+"/drives"} className="inline-flex min-h-11 items-center font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ad6800]">
        +{Math.max(0,(category.sampleBasis==="learners"?category.affected:category.distinctDrives)-shown.length)} more {category.sampleBasis==="learners"?"records":"drives"} — browse all drives
       </Link>
      </div>:null}
    </div>;
   })}
  </div>
 </section>;
}
