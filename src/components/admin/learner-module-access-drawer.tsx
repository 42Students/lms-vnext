"use client";
import {Drawer} from "@/components/ui/drawer";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";

import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {StudentRuleEditor} from "@/components/admin/student-rule-editor";
type Learner={membershipId:string;displayName:string|null;rollNumber:string|null};
type Rule={module:"projects"|"electives";label:string;stored:boolean|null;locked:boolean;blocked:boolean};
type TraceStep={level:string;inChain:boolean;source:"PERSISTED"|"SOURCE_DEFAULT"|"NONE";
 value:boolean|null;locked:boolean;ignored:boolean;winner:boolean;reason:string};
type ModuleDecision={module:string;label:string;enabled:boolean;winnerLevel:string;
 winnerLocked:boolean;explanation:string;steps:readonly TraceStep[]};
type Roster={page:number;total:number;totalPages:number};
type Detail={
 membershipId:string;displayName:string|null;rollNumber:string|null;
 placementParticipation:{
  status:"ELIGIBLE"|"INELIGIBLE"|"NOT_DECIDED";
  level:"MEMBERSHIP"|"SECTION"|"COHORT"|null;reason:string|null;
  actorName:string|null;decidedAtDisplay:string|null;
 };
 modules:readonly ModuleDecision[];
 rules:readonly Rule[];
};
export function LearnerModuleAccessDrawer({collegeId}:{collegeId:string}){
 const [search,setSearch]=useState("");
 const [suggestions,setSuggestions]=useState<Learner[]>([]);
 const [detail,setDetail]=useState<Detail|null>(null);
 const [loading,setLoading]=useState(false);
 const [rosterOpen,setRosterOpen]=useState(false);
 const [rosterLoading,setRosterLoading]=useState(false);
 const [rosterError,setRosterError]=useState("");
 const [roster,setRoster]=useState<Roster>({page:1,total:0,totalPages:1});
 const [rosterRows,setRosterRows]=useState<Learner[]>([]);
 const [rosterFilter,setRosterFilter]=useState<"overrides"|"locked">("overrides");
 const [rosterRetry,setRosterRetry]=useState(0);
 const [traceOpen,setTraceOpen]=useState(false);
 const [message,setMessage]=useState("");
 const [failedMemberId,setFailedMemberId]=useState<string|null>(null);
 const [completedSearch,setCompletedSearch]=useState("");
 const seq=useRef(0),timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 const endpoint="/api/admin/features/"+encodeURIComponent(collegeId)+"/drawer";
 useEffect(()=>()=>{seq.current++;if(timeout.current)clearTimeout(timeout.current);},[]);
 useEffect(()=>{
  // Scope changes invalidate all in-flight member reads and old trace data.
  seq.current++;
  if(timeout.current)clearTimeout(timeout.current);
  const frame=window.requestAnimationFrame(()=>{
   setSearch("");setSuggestions([]);setDetail(null);setLoading(false);
   setMessage("");setFailedMemberId(null);setCompletedSearch("");
   setRosterOpen(false);setRosterRows([]);setRoster({page:1,total:0,totalPages:1});
   setRosterError("");setRosterLoading(false);setTraceOpen(false);
  });
  return ()=>window.cancelAnimationFrame(frame);
 },[collegeId]);
 async function lookup(query:string,memberId?:string){
  const requestId=++seq.current;
  setLoading(true);setMessage("");setFailedMemberId(null);
  try{
   const params=new URLSearchParams(memberId?{membershipId:memberId}:{q:query});
   const response=await fetch(endpoint+"?"+params,{cache:"no-store"});
   if(!response.ok)throw new Error("Unable to load this learner in the selected college.");
   const result=await response.json() as {learners:Learner[];selected:Detail|null};
   if(requestId!==seq.current)return;
   if(memberId){
    setDetail(result.selected);setSuggestions([]);
    setTraceOpen(true);
    if(!result.selected){
     setMessage("Couldn't load student access.");
     setFailedMemberId(memberId);
    }
   }
   else {setSuggestions(result.learners.slice(0,10));setCompletedSearch(query.trim());}
  }catch{
   if(requestId===seq.current){
    setMessage(memberId?"Couldn't load student access.":"Couldn't load student overrides.");
    setFailedMemberId(memberId??null);
   }
  }finally{if(requestId===seq.current)setLoading(false);}
 }
 function change(value:string){
  setSearch(value);setSuggestions([]);setCompletedSearch("");setMessage("");setFailedMemberId(null);
  if(timeout.current)clearTimeout(timeout.current);
  seq.current++;
  if(value.trim().length>=2)
   timeout.current=setTimeout(()=>{void lookup(value.trim());},300);
 }
 function close(){seq.current++;setDetail(null);setTraceOpen(false);setMessage("");setFailedMemberId(null);}
 useEffect(()=>{
  if(!rosterOpen)return;
  const controller=new AbortController();
  const nextPage=roster.page;
  let active=true;
  const read=async()=>{
   setRosterLoading(true);setRosterError("");
   try{
    const response=await fetch(endpoint+"?"+new URLSearchParams({
     view:rosterFilter,page:String(nextPage),
    }),{signal:controller.signal,cache:"no-store"});
    if(!response.ok)throw Error("Couldn't load student overrides.");
    const data=await response.json() as {learners:Learner[];roster:Roster};
    if(active){setRosterRows(data.learners);setRoster(data.roster);}
   }catch(error){
    if(active&&!(error instanceof Error&&error.name==="AbortError"))
     setRosterError("Couldn't load student overrides.");
   }finally{if(active)setRosterLoading(false);}
  };
  void read();
  return ()=>{active=false;controller.abort();};
 },[endpoint,rosterOpen,roster.page,rosterFilter,rosterRetry]);
 return <section aria-label="Why a learner sees a module" className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
   <h2 className="font-semibold text-[var(--lms-heading)]">Why can&apos;t a student see a module?</h2>
   <Button type="button" variant="secondary" size="sm" onClick={()=>{
    setRosterOpen(true);setRosterFilter("overrides");
    setRoster({page:1,total:0,totalPages:1});
   }}>Student overrides</Button>
  </div>
  <label className="relative mt-[var(--lms-space-3)] grid min-w-0 max-w-[min(320px,calc(100vw-120px))] gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
   Why can&apos;t a student see a module? Search…
   <Input type="search" maxLength={100} value={search} onChange={event=>change(event.target.value)}
    placeholder="Why can't a student see a module? Search…" autoComplete="off"
    className="min-h-11 w-full pr-10 min-[768px]:min-h-9"/>
   <svg aria-hidden="true" width={18} height={18} viewBox="0 0 24 24"
     fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
     className="pointer-events-none absolute bottom-3 right-3 text-muted-foreground">
     <circle cx={11} cy={11} r={7}/><path d="m16 16 5 5"/>
   </svg>
  </label>
  {loading?<p role="status" className="mt-2 text-sm text-body leading-[22px]">Searching learners…</p>:null}
  {search.trim().length>1&&completedSearch===search.trim()&&!loading&&!suggestions.length&&!message?
   <p className="mt-2 text-xs text-body leading-5">No matching learners in this college.</p>:null}
  {suggestions.length>0?<ul aria-label="Matching learners" className="mt-2 max-h-60 w-full max-w-[min(320px,calc(100vw-120px))] overflow-auto rounded-[var(--lms-control-radius)] border border-border bg-surface shadow-sm">
   {suggestions.map(student=><li key={student.membershipId} className="border-b border-border last:border-0">
    <Button type="button" variant="ghost" onClick={()=>void lookup(search,student.membershipId)}
     className="min-h-11 w-full justify-start rounded-[var(--lms-control-radius)] px-3 py-2 text-left text-sm hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
     {student.displayName||"#"+student.membershipId.slice(0,8)} · {student.rollNumber||"No roll number"}
    </Button>
   </li>)}
  </ul>:null}
  {message?<div role="alert" className="mt-2 flex flex-wrap items-center gap-3">
    <p className="max-w-prose break-words text-sm text-error leading-[22px]">{message}</p>
    <Button type="button" variant="secondary" disabled={loading}
      onClick={()=>void lookup(search,failedMemberId??undefined)}>Retry</Button>
   </div>:null}
  <Drawer open={rosterOpen} className="md:!w-[min(520px,100vw)]" title="Student overrides"
    onOpenChange={opened=>{if(!opened)setRosterOpen(false);}}>
    <section className="min-w-0 space-y-3">
     <div className="flex flex-wrap items-center gap-2">
      {(["overrides","locked"] as const).map(mode=><Button key={mode} type="button" size="sm"
       variant={rosterFilter===mode?"primary":"secondary"}
       aria-pressed={rosterFilter===mode}
       onClick={()=>{setRosterFilter(mode);setRoster({page:1,total:0,totalPages:1});}}>
       {mode==="overrides"?"All overrides":"Locked"}
      </Button>)}
     </div>
     {rosterLoading?<p role="status" className="text-sm text-body">Loading student overrides…</p>:null}
     {rosterError?<div role="alert" className="space-y-2 text-sm text-error">
       <p>{rosterError}</p><Button type="button" size="sm" variant="secondary"
        onClick={()=>setRosterRetry(v=>v+1)}>Retry</Button>
      </div>:null}
     {!rosterLoading&&!rosterError?<div className="min-w-0 overflow-x-auto">
       <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Learner overrides in the selected college</caption>
        <thead><tr className="border-b border-border"><th className="py-2">Student</th>
         <th className="py-2">Roll number</th><th className="py-2">Review</th></tr></thead>
        <tbody>{rosterRows.map(item=><tr key={item.membershipId} className="border-b border-border">
         <td className="py-2 pr-2">{item.displayName||"Unnamed learner"}</td>
         <td className="py-2 pr-2">{item.rollNumber||"—"}</td>
         <td className="py-2"><Button size="sm" variant="secondary" type="button"
          onClick={()=>void lookup(search,item.membershipId)}>Review</Button></td>
        </tr>)}</tbody>
       </table>
       {rosterRows.length===0?<p role="status" className="py-3 text-sm text-body">No student overrides</p>:null}
      </div>:null}
     <nav className="flex flex-wrap items-center justify-between gap-2 text-sm" aria-label="Override pages">
      <p>{roster.total} learners · Page {roster.page} of {roster.totalPages} · 15 per page</p>
      <div className="flex gap-2">
       <Button type="button" size="sm" variant="secondary" disabled={rosterLoading||roster.page<=1}
        onClick={()=>setRoster(x=>({...x,page:x.page-1}))}>Previous</Button>
       <Button type="button" size="sm" variant="secondary" disabled={rosterLoading||roster.page>=roster.totalPages}
        onClick={()=>setRoster(x=>({...x,page:x.page+1}))}>Next</Button>
      </div>
     </nav>
    </section>
  </Drawer>
  <Drawer open={traceOpen} onOpenChange={open=>{if(!open)close();}}
    title="Why this student sees what they see" className="md:!w-[min(520px,100vw)]">
   {loading?<p role="status" className="text-sm text-body">Loading student access trace…</p>:null}
   {message&&!detail?<div role="alert" className="space-y-2"><p>{message}</p>
    <Button type="button" variant="secondary" onClick={()=>void lookup(search,failedMemberId??undefined)}>Retry</Button>
   </div>:null}
   {detail?<div className="min-w-0 space-y-[var(--lms-space-4)]">
    {message?<p role="alert" className="max-w-prose break-words text-sm text-error leading-[22px]">{message}</p>:null}
    <div className="min-w-0"><h3 className="text-lg font-semibold text-[var(--lms-heading)]">{detail.displayName||"#"+detail.membershipId.slice(0,8)}</h3>
      <p className="text-sm text-body leading-[22px]">{detail.rollNumber||"No roll number"}</p>
    </div>
    <section aria-label="Placement participation" className="border-b border-border pb-[var(--lms-space-4)] text-sm">
     <h4 className="font-semibold text-foreground">Placement cell decision</h4>
     <p className="mt-1">{detail.placementParticipation.status==="NOT_DECIDED"?"Not decided yet":
      detail.placementParticipation.status==="ELIGIBLE"?"Eligible":
      "Ineligible"+(detail.placementParticipation.reason?": "+detail.placementParticipation.reason:"")}</p>
     {detail.placementParticipation.level?<p className="mt-1">Scope: {detail.placementParticipation.level}</p>:null}
     {detail.placementParticipation.decidedAtDisplay?<p className="mt-1">Decided by {detail.placementParticipation.actorName||"Unknown actor"} on {
      detail.placementParticipation.decidedAtDisplay}</p>:null}
     <p className="mt-2 text-xs text-body leading-5">Placements requires both an enabled module and an eligible placement decision.</p>
     <div className="mt-3 grid gap-2 text-xs">
      <p className={detail.modules.some(m=>m.module==="placements"&&m.enabled)?
       "font-semibold text-success":"font-semibold text-error"}>
       {detail.modules.some(m=>m.module==="placements"&&m.enabled)?"✓":"✕"} College Placements module switch
      </p>
      <p className={detail.placementParticipation.status==="ELIGIBLE"?
        "font-semibold text-success":"font-semibold text-error"}>
       {detail.placementParticipation.status==="ELIGIBLE"?"✓":"✕"} Placement cell eligibility
      </p>
      {detail.placementParticipation.status==="INELIGIBLE"||
       detail.modules.some(m=>m.module==="placements"&&!m.enabled)?
       <Alert tone="warning">Placements is hidden from this learner’s menu. Direct page access is denied.
        This preview does not impersonate or change learner access.</Alert>:null}
     </div>
    </section>
    <div className="space-y-[var(--lms-space-4)]">{detail.modules.map(module=><article key={module.module}
     className="border-b border-border pb-[var(--lms-space-4)]">
      <h4 className="font-semibold text-foreground">{module.label}: {module.enabled?"On":"Off"}</h4>
      <p className="mt-1 text-xs text-body leading-5">{module.explanation}</p>
      <p className="mt-1 text-xs text-muted-foreground">
       Winning scope: {module.winnerLevel} · {module.winnerLocked?"Locked override":"Normal inheritance"}
      </p>
      <ol className="mt-3 space-y-2 border-l border-border pl-3" aria-label={module.label+" scope-by-scope trace"}>
       {module.steps.map(step=><li key={step.level} className="space-y-1 text-xs">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
         <strong className="text-foreground">{step.level==="DEFAULT"?"Source default":step.level}</strong>
         <StatusBadge tone={step.winner?"success":step.ignored?"warning":"neutral"}>
          {step.winner?"Decided":step.ignored?"Ignored":"Inherited"}
         </StatusBadge>
         {step.locked?<StatusBadge tone="warning">Locked</StatusBadge>:null}
         <span className="text-muted-foreground">
          {step.source==="PERSISTED"?step.value?"Stored On":"Stored Off":
           step.source==="SOURCE_DEFAULT"?step.value?"Default On":"Default Off":"No stored rule"}
         </span>
        </div>
        <p className="text-body">{step.reason}</p>
       </li>)}
      </ol>
      {detail.rules.filter(rule=>rule.module===module.module).map(rule=>
       <div key={detail.membershipId+":"+rule.module} className="mt-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
         <StatusBadge tone={rule.stored===null?"neutral":rule.stored?"success":"warning"}>
          {rule.stored===null?"Inherit":rule.stored?"On":"Off"}
         </StatusBadge>
         {rule.locked?<StatusBadge tone="warning">
          {rule.stored===null?"Legacy lock · no explicit value":"Locked"}
         </StatusBadge>:null}
         {rule.blocked?<span className="text-warning-text">Locked by a broader rule</span>:null}
        </div>
        <StudentRuleEditor collegeId={collegeId}
         membershipId={detail.membershipId} module={rule.module} stored={rule.stored}
         locked={rule.locked} blocked={rule.blocked}/>
       </div>)}
     </article>)}</div>
    <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] border-t border-border pt-[var(--lms-space-4)] min-[768px]:flex-row min-[768px]:flex-wrap min-[768px]:items-center [&>button]:w-full min-[768px]:[&>button]:w-auto">
    <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
     onClick={()=>void lookup(search,detail.membershipId)} disabled={loading}>
     Recheck access after a change
    </Button>
    <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
     href={"/admin/features/"+encodeURIComponent(collegeId)+"/trace?membershipId="+encodeURIComponent(detail.membershipId)}>
     Open full access trace →
    </Link>
     <Button type="button" variant="secondary" className="min-h-11 min-[768px]:min-h-9" onClick={close} aria-label="Close student explanation">Close</Button>
    </div>
    <p className="text-xs text-body leading-5">This reads persisted learner access. It does not sign in as the student.</p>
   </div>:null}
  </Drawer>
 </section>;
}
