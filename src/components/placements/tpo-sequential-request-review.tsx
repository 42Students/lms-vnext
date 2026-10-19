"use client";
import {useState} from "react";
import {TpoRequestDecisionControl} from "./tpo-request-decision-control";
import {Button} from "@/components/ui/button";

type Row={
 id:string;studentName:string;requestType:string;reason:string;
 jobTitle:string;companyName:string;expectedUpdatedAt:string;
};
export function TpoSequentialRequestReview({requests}:{requests:readonly Row[]}){
 const [sequence,setSequence]=useState<string[]>([]);
 const [position,setPosition]=useState(0);
 const [decided,setDecided]=useState(0);
 const [message,setMessage]=useState("");
 const current=sequence.length?requests.find(row=>row.id===sequence[position]):null;
 function stop(){
  const remaining=Math.max(0,sequence.length-position);
  setMessage(`Stopped at ${position+1} of ${sequence.length}. The other ${remaining} request(s) are still in the queue.`);
  setSequence([]);setPosition(0);setDecided(0);
 }
 function advance(saved:boolean){
  if(saved)setDecided(n=>n+1);
  if(position+1>=sequence.length){
   setMessage(saved?`Finished reviewing ${sequence.length} requests. ${decided+1} decided in this session.`:
    `Reached the end of ${sequence.length} requests. Undecided requests remain in the queue.`);
   setSequence([]);setPosition(0);setDecided(0);
  }else{
   setPosition(n=>n+1);
  }
 }
 return <section aria-label="Review one by one" className="space-y-3 border-b border-border pb-6">
  <h2 className="font-semibold">Review one by one</h2>
  {!sequence.length?<Button variant="secondary" type="button" disabled={!requests.length} onClick={()=>{
   setSequence(requests.map(item=>item.id));setPosition(0);setDecided(0);setMessage("");
  }} >
   Start with the first of {requests.length}
  </Button>:current?<div className="space-y-3 border-t border-border pt-4">
   <p role="status" className="text-sm font-semibold">{position+1} of {sequence.length} · {decided} decided</p>
   <p className="font-semibold">{current.studentName} · {current.requestType.replaceAll("_"," ")}</p>
   <p className="text-sm text-body">{current.companyName} · {current.jobTitle}</p>
   <p className="whitespace-pre-wrap text-sm text-body">{current.reason}</p>
   <TpoRequestDecisionControl key={current.id} requestId={current.id}
    expectedUpdatedAt={current.expectedUpdatedAt} requestType={current.requestType}
    onSuccess={()=>advance(true)} />
   <div className="flex flex-wrap gap-2">
    <Button variant="secondary" type="button" onClick={()=>advance(false)}
     >{position+1===sequence.length?"Finish":"Next"}</Button>
    <Button variant="secondary" type="button" onClick={stop}
     >Stop and return to queue</Button>
   </div>
  </div>:<div className="space-y-2">
   <p role="status" className="text-sm">This request is no longer pending on the visible page.</p>
   <Button variant="secondary" type="button" onClick={()=>advance(false)} >Next</Button>
   <Button variant="secondary" type="button" onClick={stop} className="ml-2">Finish</Button>
  </div>}
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
  <p className="text-xs text-muted-foreground">This session covers the pending requests on the visible page. Each decision is independently persisted and rechecked on the server.</p>
 </section>;
}
