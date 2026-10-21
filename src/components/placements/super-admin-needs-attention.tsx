"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {useState} from "react";
type Attention={code:string;jobId:string;jobTitle:string;companyName:string;count:number;priority:string};
const categories=[
 {code:"STALE_APPLICATIONS",label:"Applications with no action in a week",tab:"APPLIED"},
 {code:"INTERVIEW_UNSCHEDULED",label:"Marked Interview, nothing scheduled",tab:"INTERVIEW"},
 {code:"OFFERED_NO_LETTER",label:"Offered, no offer letter attached",tab:"ALL"},
 {code:"CLOSING_SOON_LOW_CONVERSION",label:"Closing soon, low conversion",tab:"ALL"},
] as const;
export function SuperAdminNeedsAttention({items,basePath}:{items:readonly Attention[];basePath:string}){
 const [expanded,setExpanded]=useState<string[]>([]);
 const active=categories.map(category=>({...category,
  rows:items.filter(item=>item.code===category.code)}));
 const total=active.reduce((sum,category)=>sum+
  category.rows.reduce((count,item)=>count+Math.max(0,item.count),0),0);
 const distinctDrives=new Set(items.filter(item=>
  categories.some(category=>category.code===item.code)).map(item=>item.jobId)).size;
 return <section aria-label="Needs attention" className="border-b border-border pb-5">
  <h2 className="border-b border-border pb-3 text-base font-semibold">Needs attention ({total} affected)</h2>
  <p className="mt-2 text-xs text-muted-foreground">
   {distinctDrives} distinct flagged drives. A candidate may appear in more than one attention category.
  </p>
  {total===0?<p role="status" className="py-4 text-sm">No drives currently flagged in this view.</p>:null}
  <div className="divide-y divide-border">
   {active.map(category=>{
    const showAll=expanded.includes(category.code);
    const visible=showAll?category.rows:category.rows.slice(0,3);
    return <div key={category.code} className="space-y-2 py-4">
     <h3 className="text-sm font-semibold">{category.label} ({category.rows.reduce((sum,item)=>sum+Math.max(0,item.count),0)} affected across {category.rows.length} drives)</h3>
     {visible.map(item=><Link key={item.jobId} href={basePath+"/jobs/"+
      encodeURIComponent(item.jobId)+(category.code==="CLOSING_SOON_LOW_CONVERSION"?"":"/applications?stage="+category.tab)}
      className="block min-h-10 border-l-2 border-transparent px-3 py-2 text-sm text-primary-text hover:border-primary hover:bg-primary-subtle active:border-primary active:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
       {item.companyName} · {item.jobTitle}
       <span className="ml-2 text-xs text-muted-foreground">{item.count} affected</span>
     </Link>)}
     {category.rows.length>3?<Button variant="ghost" size="sm" type="button" onClick={()=>
      setExpanded(old=>showAll?old.filter(x=>x!==category.code):[...old,category.code])}
      className="text-primary-text underline">
       {showAll?"Show less":"+"+(category.rows.length-3)+" more"}
     </Button>:null}
     {category.rows.length? <p className="text-xs text-muted-foreground">
      Showing {visible.length} of {category.rows.length} flagged drives; affected candidate counts are separate.</p>:null}
    </div>;
   })}
  </div>
 </section>;
}
