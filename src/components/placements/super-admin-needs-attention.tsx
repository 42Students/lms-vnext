"use client";
import Link from "next/link";
import {useState} from "react";
type Attention={code:string;jobId:string;jobTitle:string;companyName:string;count:number;priority:string};
const categories=[
 {code:"STALE_APPLICATIONS",label:"Applications with no action in a week",tab:"APPLIED"},
 {code:"INTERVIEW_UNSCHEDULED",label:"Marked Interview, nothing scheduled",tab:"INTERVIEW"},
 {code:"OFFERED_NO_LETTER",label:"Offered, no offer letter attached",tab:"OFFERED"},
 {code:"CLOSING_SOON_LOW_CONVERSION",label:"Closing soon, low conversion",tab:"ALL"},
] as const;
export function SuperAdminNeedsAttention({items,basePath}:{items:readonly Attention[];basePath:string}){
 const [expanded,setExpanded]=useState<string[]>([]);
 const active=categories.map(category=>({...category,
  rows:items.filter(item=>item.code===category.code)}));
 const total=active.reduce((sum,category)=>sum+category.rows.length,0);
 return <section aria-label="Needs attention" className="rounded-xl border border-border bg-surface">
  <h2 className="border-b border-border px-5 py-4 text-base font-semibold">Needs attention ({total})</h2>
  {total===0?<p role="status" className="p-5 text-sm">No drives currently flagged in this view.</p>:null}
  <div className="divide-y divide-border">
   {active.map(category=>{
    const showAll=expanded.includes(category.code);
    const visible=showAll?category.rows:category.rows.slice(0,3);
    return <div key={category.code} className="space-y-2 p-5">
     <h3 className="text-sm font-semibold">{category.label} ({category.rows.length})</h3>
     {visible.map(item=><Link key={item.jobId} href={basePath+"/jobs/"+
      encodeURIComponent(item.jobId)"+/applications?stage="+category.tab}
      className="block min-h-10 rounded border border-border p-3 text-sm text-primary-text hover:bg-primary-subtle">
       {item.companyName} · {item.jobTitle}
       <span className="ml-2 text-xs text-muted-foreground">{item.count} affected</span>
     </Link>)}
     {category.rows.length>3?<button type="button" onClick={()=>
      setExpanded(old=>showAll?old.filter(x=>x!==category.code):[...old,category.code])}
      className="min-h-10 text-sm font-semibold text-primary-text underline">
       {showAll?"Show less":"+"+(category.rows.length-3)+" more"}
     </button>:null}
     {category.rows.length? <p className="text-xs text-muted-foreground">
      Showing top {visible.length} of {category.rows.length}</p>:null}
    </div>;
   })}
  </div>
 </section>;
}
