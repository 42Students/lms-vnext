"use client";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import Link from "next/link";
import {tpoReviewOneByOneHref} from "@/modules/placements/tpo-bulk-follow-up-model";
export function TpoSelectedReviewQueue({jobId,rows}:{jobId:string;rows:readonly {id:string;label:string}[]}){
 const [open,setOpen]=useState(false),[index,setIndex]=useState(0);
 const current=rows[Math.min(index,Math.max(rows.length-1,0))];
 return <div className="space-y-2">
  <Button variant="secondary" type="button" disabled={rows.length===0} onClick={()=>{setIndex(0);setOpen(true);}}
   >Review one by one</Button>
  {open&&current?<section aria-label="Selected applicant review queue"
    className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
   <div className="flex flex-wrap justify-between gap-2">
    <h4 className="font-semibold">Review one by one · {index+1} of {rows.length}</h4>
    <Button variant="secondary" type="button" onClick={()=>setOpen(false)} >Close</Button>
   </div>
   <p className="break-words text-sm">{current.label}</p>
   <p className="text-xs text-muted-foreground">Open the applicant&apos;s authorized detail to make a decision. Return to this tab to continue through the selected queue.</p>
   <Link href={tpoReviewOneByOneHref(jobId,current.id)} target="_blank" rel="noopener noreferrer"
    className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary">
    Open selected applicant
   </Link>
   <div className="flex gap-3">
    <Button variant="secondary" type="button" disabled={index===0} onClick={()=>setIndex(index-1)}
     >Previous</Button>
    <Button variant="secondary" type="button" disabled={index>=rows.length-1} onClick={()=>setIndex(index+1)}
     >Next applicant</Button>
   </div>
  </section>:null}
 </div>;
}
