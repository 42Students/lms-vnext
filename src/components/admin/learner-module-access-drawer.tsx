"use client";
import {Drawer} from "@/components/ui/drawer";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {StudentRuleEditor} from "@/components/admin/student-rule-editor";
type Learner={membershipId:string;displayName:string|null;rollNumber:string|null};
type Rule={module:"projects"|"electives";label:string;stored:boolean|null;locked:boolean;blocked:boolean};
type Detail={
 membershipId:string;displayName:string|null;rollNumber:string|null;
 placementParticipation:{
  status:"ELIGIBLE"|"INELIGIBLE"|"NOT_DECIDED";
  level:"MEMBERSHIP"|"SECTION"|"COHORT"|null;reason:string|null;
  actorName:string|null;decidedAtDisplay:string|null;
 };
 modules:readonly {module:string;label:string;enabled:boolean;winnerLevel:string;winnerLocked:boolean;explanation:string}[];
 rules:readonly Rule[];
};
export function LearnerModuleAccessDrawer({collegeId}:{collegeId:string}){
 const [search,setSearch]=useState("");
 const [suggestions,setSuggestions]=useState<Learner[]>([]);
 const [detail,setDetail]=useState<Detail|null>(null);
 const [loading,setLoading]=useState(false);
 const [message,setMessage]=useState("");
 const seq=useRef(0),timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 const endpoint="/api/admin/features/"+encodeURIComponent(collegeId)+"/trace";
 useEffect(()=>()=>{seq.current++;if(timeout.current)clearTimeout(timeout.current);},[]);
 async function lookup(query:string,memberId?:string){
  const requestId=++seq.current;
  setLoading(true);setMessage("");
  try{
   const params=new URLSearchParams(memberId?{membershipId:memberId}:{q:query});
   const response=await fetch(endpoint+"?"+params,{cache:"no-store"});
   if(!response.ok)throw new Error("Unable to load this learner in the selected college.");
   const result=await response.json() as {learners:Learner[];selected:Detail|null};
   if(requestId!==seq.current)return;
   if(memberId){setDetail(result.selected);setSuggestions([]);}
   else setSuggestions(result.learners);
  }catch{
   if(requestId===seq.current)setMessage("The learner lookup failed. Check your connection and try again.");
  }finally{if(requestId===seq.current)setLoading(false);}
 }
 function change(value:string){
  setSearch(value);setSuggestions([]);setMessage("");
  if(timeout.current)clearTimeout(timeout.current);
  seq.current++;
  if(value.trim().length>=2)
   timeout.current=setTimeout(()=>{void lookup(value.trim());},260);
 }
 function close(){seq.current++;setDetail(null);setMessage("");}
 return <section aria-label="Why a learner sees a module" className="border-b border-border pb-5">
  <h2 className="font-semibold text-foreground">Why can&apos;t a student see a module?</h2>
  <label className="mt-3 grid gap-1 text-[13px] font-semibold text-body">
   Why can&apos;t a student see a module? Search…
   <Input type="search" maxLength={100} value={search} onChange={event=>change(event.target.value)}
    placeholder="Name or roll number" autoComplete="off"
    className="min-h-11 w-full min-[768px]:min-h-9"/>
  </label>
  {loading?<p role="status" className="mt-2 text-sm text-body">Searching learners…</p>:null}
  {search.trim().length>1&&!loading&&!suggestions.length&&!message?
   <p className="mt-2 text-xs text-body">No matching learners in this college.</p>:null}
  {suggestions.length>0?<ul aria-label="Matching learners" className="mt-2 max-h-60 overflow-auto rounded-[var(--lms-control-radius)] border border-border">
   {suggestions.map(student=><li key={student.membershipId} className="border-b border-border last:border-0">
    <Button type="button" variant="ghost" onClick={()=>void lookup(search,student.membershipId)}
     className="min-h-11 w-full px-3 py-2 text-left text-sm hover:bg-primary-subtle">
     {student.displayName||"Unnamed learner"} · {student.rollNumber||"No roll number"}
    </Button>
   </li>)}
  </ul>:null}
  {message?<p role="alert" className="mt-2 text-sm text-error">{message}</p>:null}
  <Drawer open={detail!==null} onOpenChange={open=>{if(!open)close();}} title="Student module access explanation">
   {detail?<div className="space-y-4">
    <div className="flex items-start justify-between gap-3">
     <div><h3 className="text-lg font-semibold text-foreground">{detail.displayName||"Unnamed learner"}</h3>
      <p className="text-sm text-body">{detail.rollNumber||"No roll number"}</p>
     </div>
     <Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={close} aria-label="Close student explanation">Close</Button>
    </div>
    <section aria-label="Placement participation" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm">
     <h4 className="font-semibold text-foreground">Placement cell decision</h4>
     <p className="mt-1">{detail.placementParticipation.status==="NOT_DECIDED"?"Not decided yet":
      detail.placementParticipation.status==="ELIGIBLE"?"Eligible":
      "Ineligible"+(detail.placementParticipation.reason?": "+detail.placementParticipation.reason:"")}</p>
     {detail.placementParticipation.level?<p className="mt-1">Scope: {detail.placementParticipation.level}</p>:null}
     {detail.placementParticipation.decidedAtDisplay?<p className="mt-1">Decided by {detail.placementParticipation.actorName||"Unknown actor"} on {
      detail.placementParticipation.decidedAtDisplay}</p>:null}
     <p className="mt-2 text-xs text-body">Placements requires both an enabled module and an eligible placement decision.</p>
    </section>
    <div className="space-y-4">{detail.modules.map(module=><article key={module.module}
     className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3">
      <h4 className="font-semibold text-foreground">{module.label}: {module.enabled?"On":"Off"}</h4>
      <p className="mt-1 text-xs text-body">{module.explanation}</p>
      {detail.rules.filter(rule=>rule.module===module.module).map(rule=>
       <StudentRuleEditor key={detail.membershipId+":"+rule.module} collegeId={collegeId}
        membershipId={detail.membershipId} module={rule.module} stored={rule.stored}
        locked={rule.locked} blocked={rule.blocked}/>)}
     </article>)}</div>
    <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
     onClick={()=>void lookup(search,detail.membershipId)} disabled={loading}>
     Recheck access after a change
    </Button>
    <p className="text-xs text-body">This reads persisted learner access. It does not sign in as the student.</p>
    <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
     href={"/admin/features/"+encodeURIComponent(collegeId)+"/trace?membershipId="+encodeURIComponent(detail.membershipId)}>
     Open full access trace →
    </Link>
   </div>:null}
  </Drawer>
 </section>;
}
