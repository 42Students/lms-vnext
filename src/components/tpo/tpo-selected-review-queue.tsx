"use client";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import {tpoReviewOneByOneHref} from "@/modules/placements/tpo-bulk-follow-up-model";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
export function TpoSelectedReviewQueue({jobId,rows}:{jobId:string;rows:readonly {id:string;label:string}[]}){
 const [open,setOpen]=useState(false),[index,setIndex]=useState(0);
 const current=rows[Math.min(index,Math.max(rows.length-1,0))];
 return <div className="space-y-2">
  <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={rows.length===0} onClick={()=>{setIndex(0);setOpen(true);}}
   >Review one by one</Button>
  {open&&current?<section aria-label="Selected applicant review queue"
    className="min-w-0 space-y-3 border-t border-border py-4">
   <div className="flex min-w-0 flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
    <Heading level={4}>Review one by one · {index+1} of {rows.length}</Heading>
    <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>setOpen(false)} >Close</Button>
   </div>
   <p className="break-words text-sm">{current.label}</p>
   <p className="text-xs text-muted-foreground">Open the applicant&apos;s authorized detail to make a decision. Return to this tab to continue through the selected queue.</p>
   <ButtonLink variant="primary" href={tpoReviewOneByOneHref(jobId,current.id)} rel="noopener noreferrer">
    Open selected applicant
   </ButtonLink>
   <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
    <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={index===0} onClick={()=>setIndex(index-1)}
     >Previous</Button>
    <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={index>=rows.length-1} onClick={()=>setIndex(index+1)}
     >Next applicant</Button>
   </div>
  </section>:null}
 </div>;
}
