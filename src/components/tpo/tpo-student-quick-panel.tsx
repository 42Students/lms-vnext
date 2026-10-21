"use client";
import {Button} from "@/components/ui/button";
import {Tabs} from "@/components/ui/tabs";
import {Drawer} from "@/components/ui/drawer";
import {InlineNotice} from "@/components/ui/inline-notice";
import {apiFetch} from "@/lib/api-fetch";
import Link from "next/link";
import {tpoStudentDisplayLabel} from "@/modules/placements/tpo-student-display-label";
import {useEffect,useRef,useState} from "react";
import type {TpoStudentRow} from "@/modules/placements/tpo-students-model";
import {TpoStudentNudgePanel} from "./tpo-student-nudge-panel";
import {TpoStudentNoteEditor} from "./tpo-student-note-editor";
import {afterCollegeDisplay,type AfterCollegeOutcome} from "@/modules/placements/tpo-after-college-model";
import {TpoRequestDecisionControl} from "@/components/placements/tpo-request-decision-control";

type Tab="Profile"|"Placement"|"Requests"|"Notes"|"History";
const tabs:readonly Tab[]=["Profile","Placement","Requests","Notes","History"];
type PanelDetail={applications:{id:string;jobId:string;title:string;status:string}[];requests:{id:string;status:string;type:string;reason:string;note:string|null;requestedAt:string;updatedAt:string;job:string}[];
 notes:{id:string;body:string;createdAt:string;job:string}[];
 studentNotes:{id:string;note:string;createdAt:string;authorUserId:string}[];
 teamHistory:{id:string;eventType:string;summary:string;occurredAt:string;subjectType:string;actorUserId:string|null}[];
 truncated:boolean};
export function TpoStudentQuickPanel({student,rows,onNavigate,onClose,recordedOutcome}:{
 student:TpoStudentRow;rows:readonly TpoStudentRow[];
 onNavigate:(membershipId:string)=>void;onClose:()=>void;recordedOutcome?:AfterCollegeOutcome|null;
}){
 const [tab,setTab]=useState<Tab>("Profile");
 // Tie cached data to its membership so a rapid Next/Previous never shows
 // another learner's private notes while a fresh request is in flight.
 const [storedDetail,setStoredDetail]=useState<{studentId:string;value:PanelDetail}|null>(null);
 const detail=storedDetail?.studentId===student.membershipId?storedDetail.value:null;
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const activeLoad=useRef<AbortController|null>(null);

 async function fetchDetail(){
  activeLoad.current?.abort();
  const controller=new AbortController();
  activeLoad.current=controller;
  setLoading(true);setError("");
  try{
   const body=await apiFetch<{student:unknown;applications:PanelDetail["applications"];requests:PanelDetail["requests"];notes:PanelDetail["notes"];studentNotes:PanelDetail["studentNotes"];teamHistory:PanelDetail["teamHistory"];truncated?:boolean}>(
    "/api/placements/tpo/students/"+encodeURIComponent(student.membershipId)+"/panel",
    {cache:"no-store",signal:controller.signal});
   if(controller.signal.aborted||activeLoad.current!==controller)return;
   if(!body?.student)throw Error("We couldn\'t open this student");
   setStoredDetail({studentId:student.membershipId,value:body as PanelDetail});
  }catch(e){
   if(!controller.signal.aborted&&activeLoad.current===controller)
    setError("We couldn\'t open this student");
  }finally{
   if(activeLoad.current===controller){
    activeLoad.current=null;
    setLoading(false);
   }
  }
 }
 async function chooseTab(next:Tab){
  setTab(next);setError("");
  if((next==="Requests"||next==="Notes"||next==="History"||next==="Placement")&&!detail)
   await fetchDetail();
 }
 useEffect(()=>{
  let live=true;
  void Promise.resolve().then(()=>{if(live)void fetchDetail();});
  return ()=>{live=false;activeLoad.current?.abort();activeLoad.current=null;};
 // Only a learner identity change starts a fresh load; tab changes are user-initiated.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[student.membershipId]);
 const when=(value:string)=>new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
 const index=rows.findIndex(row=>row.membershipId===student.membershipId);
 const attention=[
  !student.registeredForPlacements?"Placement registration not recorded":null,
   student.debarred===true?"Debarred from new placement applications":null,
   student.profileFacts?.resume===false?"No resume recorded":null,
   student.participationStatus==="INELIGIBLE"?"Not eligible for placements":null,
   student.verification.status==="WAITING"?"Profile verification waiting: "+student.verification.waitingSections.join(", "):null,
   student.verification.status==="SENT_BACK"?"Profile correction needed":null,
   student.offersAwaitingAnswer>0?student.offersAwaitingAnswer+" offer(s) waiting on an answer":null,
  student.ambiguousSection?"Conflicting active class membership requires review":null,
  student.readinessSignal==="ACADEMIC_EVIDENCE_MISSING"?"Academic evidence is incomplete":null,
  student.journeyState==="READY_NOT_APPLYING"?"No active applications recorded":null,
 ].filter((value):value is string=>Boolean(value));
 const history="/tpo/students/"+encodeURIComponent(student.membershipId)+"/history";
 const participation="/tpo/students/"+encodeURIComponent(student.membershipId)+"/participation";
 return <Drawer open={true} onOpenChange={next=>{if(!next)onClose();}}
  title={"Student panel for "+student.displayName}
  description={student.branchName+" · "+student.cohortName} footer={<div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
    <span className="col-span-2 text-center text-xs text-muted-foreground sm:col-span-1 sm:col-start-2 sm:row-start-1">{index+1} of {rows.length} on this page</span>
    <Button variant="secondary" type="button" className="min-h-11 w-full sm:col-start-1 sm:row-start-1 md:min-h-9" disabled={index<=0} onClick={()=>onNavigate(rows[index-1].membershipId)}>← Previous</Button>
    <Button variant="secondary" type="button" className="min-h-11 w-full sm:col-start-3 sm:row-start-1 md:min-h-9" disabled={index<0||index>=rows.length-1}
      onClick={()=>onNavigate(rows[index+1].membershipId)}>Next →</Button>
   </div>}>
   <section className="min-w-0 border-b border-border pb-4">
    <p className="min-w-0 break-words text-sm text-body">{student.rollNumber??student.registrationNumber??"No roll number"} · {student.branchName}</p>
    <p className="mt-1 min-w-0 break-words text-xs text-muted-foreground">{student.cohortName} · {tpoStudentDisplayLabel(student.journeyState)}</p>
    <p className="mt-2 min-w-0 break-words text-sm font-semibold">After college: {afterCollegeDisplay(recordedOutcome)}</p>
   </section>
   <Tabs ariaLabel="Student panel pages" className="mt-4" value={tab} renderPanel={false} controlledOnly
    onValueChange={next=>{void chooseTab(next as Tab);}}
    items={tabs.map(t=>({
      value:t,
      label:t==="Requests"&&detail?.requests.some(row=>row.status==="PENDING")
        ?t+" ("+detail.requests.filter(row=>row.status==="PENDING").length+" waiting)"
        :t,
    }))}/>
   <div className="mt-4 min-w-0 space-y-5 text-sm">
    {tab==="Profile"?<>
      <h3 className="font-semibold">Needs attention</h3>
      {attention.length?<ul className="list-disc space-y-1 pl-5 break-words">{attention.map(item=><li key={item}>{item}</li>)}</ul>
       :<p className="text-body">No attention flags derived from the current roster evidence.</p>}
      <h3 className="border-t border-border pt-4 font-semibold">Recorded learner facts</h3>
      <dl className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-0 md:grid-cols-2">
       {[
        ["Program",student.programName],["Branch",student.branchName],
        ["Batch",student.cohortName],["Roll number",student.rollNumber??"Not recorded"],
        ["CGPA",student.cgpa??"Not recorded"],["PG % (profile entry)",student.profileFacts?.pgPercentage??"Not recorded"],
        ["Degree",student.profileFacts?.degree??"Not recorded"],["Entrance exam",student.profileFacts?.entranceExam??"Not recorded"],
        ["Phone (last four)",student.profileFacts?.phoneMasked??"Not recorded"],
        ["LinkedIn",student.profileFacts?.linkedIn??"Not recorded"],["GitHub",student.profileFacts?.github??"Not recorded"],
        ["Portfolio",student.profileFacts?.portfolio??"Not recorded"],
        ["Active backlogs",student.activeBacklogs??"Not recorded"],
        ["Past backlogs",student.pastBacklogs??"Not recorded"],
        ["After college",afterCollegeDisplay(recordedOutcome)],
        ["Stage",tpoStudentDisplayLabel(student.journeyState)],
        ["Profile check",student.verification.status==="UNKNOWN"?"Verification unavailable":tpoStudentDisplayLabel(student.verification.status)],
        ["Placements decision",tpoStudentDisplayLabel(student.participationStatus)],
        ["Offers waiting on their answer",student.offersAwaitingAnswer],
        ["Prep %","Not recorded"],
        ["Registration",student.registrationChoice??"Not recorded"],
        ].map(([label,value])=><div key={String(label)} className="min-w-0 border-b border-border py-2.5">
        <dt className="break-words text-xs text-muted-foreground">{label}</dt><dd className="min-w-0 break-words font-semibold">{value}</dd>
       </div>)}
      </dl>
      {detail?.requests.filter(row=>row.status==="PENDING").length?
       <p role="status" className="text-sm font-semibold">{detail.requests.filter(row=>row.status==="PENDING").length} student request(s) waiting for a decision.</p>:null}
      {student.participationReason?<div className="space-y-1 border-l-2 border-warning bg-warning-subtle px-3 py-3">
       <p className="font-semibold">Placement eligibility decision</p>
       <p>{student.participationReason}</p>
       <p className="text-xs text-muted-foreground">Set at {student.participationLevel??"placement"} level
        {student.participationDecidedAt?" · "+when(student.participationDecidedAt.toString()):""}</p>
      </div>:null}
      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
       <Link href={participation} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 focus-visible:underline">Placement eligibility</Link>
       <Link href={"/tpo/team?about="+encodeURIComponent("STUDENT:"+student.membershipId)}
        className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 focus-visible:underline">Discuss with team</Link>
      </div>
    </>:null}
    {tab==="Placement"?<>
      <h3 className="font-semibold">Placement journey</h3>
      <dl className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-0 md:grid-cols-2">
       {[
        ["Participation",tpoStudentDisplayLabel(student.participationStatus)],["Applications",student.applicationCount],
        ["Active applications",student.activeApplicationCount],["Offers",student.offerCount],
        ["Accepted offers",student.acceptedOfferCount],["Best so far",student.bestCompany?
         student.bestCompany+": "+tpoStudentDisplayLabel(student.bestSoFar):tpoStudentDisplayLabel(student.bestSoFar)],
        ].map(([label,value])=><div key={String(label)} className="min-w-0 border-b border-border py-2.5">
        <dt className="break-words text-xs text-muted-foreground">{label}</dt><dd className="min-w-0 break-words font-semibold">{value}</dd>
       </div>)}
      </dl>
      <h3 className="font-semibold">Applications</h3>
      {detail&&!detail.applications?.length?<p>No recorded placement applications.</p>:null}
      {detail?.applications?.map(row=><div key={row.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3">
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">{row.title} · {row.status.replaceAll("_"," ")}</span>
        <Link href={"/tpo/placements/jobs/"+encodeURIComponent(row.jobId)} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 focus-visible:underline">Open drive</Link>
      </div>)}
      <Link href={participation} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 focus-visible:underline">Manage placement participation</Link>
      <TpoStudentNudgePanel key={student.membershipId} rows={[{id:student.membershipId,label:student.displayName,
       registered:student.registeredForPlacements}]}/>
    </>:null}
    {loading&&(tab==="Requests"||tab==="Notes"||tab==="History"||tab==="Placement")?<p role="status" className="text-sm text-body">Loading student records…</p>:null}
    {error?<div className="min-w-0 space-y-2"><InlineNotice tone="error" message={error}/>
     <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>void fetchDetail()}>Retry</Button></div>:null}
    {tab==="Requests"?<>
      <h3 className="font-semibold">Requests</h3>
      {detail&&!detail.requests.length?<p>No placement requests recorded for this student.</p>:null}
      {detail?.requests.map(row=><article key={row.id} className="min-w-0 space-y-1 border-b border-border py-3">
        <p className="font-semibold">{row.type.replaceAll("_"," ")} · {row.status}</p>
        <p className="text-xs text-muted-foreground">{row.job} · {when(row.requestedAt)}</p>
        <p className="break-words [overflow-wrap:anywhere]">{row.reason}</p>{row.note?<p className="break-words [overflow-wrap:anywhere]">Decision: {row.note}</p>:null}
        {row.status==="PENDING"?<TpoRequestDecisionControl
          requestId={row.id} requestType={row.type} expectedUpdatedAt={row.updatedAt}
          onSuccess={()=>void fetchDetail()}/>:null}
      </article>)}
      <Link href={"/tpo/students/requests?search="+encodeURIComponent(student.displayName)}
       className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 focus-visible:underline">Review student&apos;s requests</Link>
    </>:null}
    {tab==="Notes"?<>
      <h3 className="font-semibold">Internal Notes</h3>
      <TpoStudentNoteEditor key={student.membershipId} membershipIds={[student.membershipId]} afterSave={()=>void fetchDetail()}/>
      {detail?.studentNotes?.map(row=><article key={row.id} className="min-w-0 space-y-1 border-b border-border py-3">
       <p className="break-words [overflow-wrap:anywhere]">{row.note}</p><p className="break-words [overflow-wrap:anywhere] text-xs text-muted-foreground">{when(row.createdAt)} · Author {row.authorUserId}</p>
      </article>)}
      {detail&&!detail.notes.length?<p>No private application notes recorded for this student.</p>:null}
      {detail?.notes.map(row=><article key={row.id} className="min-w-0 space-y-1 border-b border-border py-3">
        <p className="break-words [overflow-wrap:anywhere]">{row.body}</p>
        <p className="text-xs text-muted-foreground">{row.job} · {when(row.createdAt)}</p>
      </article>)}
      <Link href={history} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 focus-visible:underline">Open placement history</Link>
    </>:null}
    {detail?.truncated&&(tab==="Requests"||tab==="Notes"||tab==="History")?<p className="text-xs text-warning-text">
      Most recent records shown; open the full Requests or History page for older entries.
    </p>:null}
    {tab==="History"?<>
      <h3 className="font-semibold">Team and student activity</h3>
      {detail&&!detail.teamHistory?.length?<p>No recorded team actions for this student.</p>:null}
      <ol className="space-y-2">{detail?.teamHistory?.map(row=><li key={row.id} className="min-w-0 border-b border-border py-3">
       <p className="break-words [overflow-wrap:anywhere] font-semibold">{row.summary}</p>
       <p className="mt-1 text-xs text-muted-foreground">{when(row.occurredAt)} · {row.eventType}</p>
      </li>)}</ol>
      <p>Open the tenant-authorized historical application, round result, offer and joining timeline.</p>
      <Link href={history} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 focus-visible:underline">View full placement history</Link>
    </>:null}
   </div>

 </Drawer>;
}
