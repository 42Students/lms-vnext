"use client";
import {apiFetch} from "@/lib/api-fetch";
import Link from "next/link";
import {tpoStudentDisplayLabel} from "@/modules/placements/tpo-student-display-label";
import {useEffect,useState} from "react";
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
 const [detail,setDetail]=useState<PanelDetail|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 async function fetchDetail(){
  setLoading(true);setError("");
  try{const body=await apiFetch<{student:unknown;applications:PanelDetail["applications"];requests:PanelDetail["requests"];notes:PanelDetail["notes"];studentNotes:PanelDetail["studentNotes"];teamHistory:PanelDetail["teamHistory"];truncated?:boolean}>("/api/placements/tpo/students/"+encodeURIComponent(student.membershipId)+"/panel",{cache:"no-store"});
   if(!body?.student)throw Error("Could not load student records. Please try again.");
   setDetail(body as PanelDetail);
  }catch(e){setError(e instanceof Error?e.message:"Could not load student records");}
  finally{setLoading(false);}
 }
 async function chooseTab(next:Tab){
  setTab(next);setError("");
  if(next!=="Requests"&&next!=="Notes"&&next!=="History"&&next!=="Placement"||detail)return;
  await fetchDetail();
 }
 useEffect(()=>{
  let live=true;
  void Promise.resolve().then(()=>{if(live)return fetchDetail();});
  return ()=>{live=false;};
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
 useEffect(()=>{
  const close=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();};
  document.addEventListener("keydown",close);
  return ()=>document.removeEventListener("keydown",close);
 },[onClose]);
 const history="/tpo/students/"+encodeURIComponent(student.membershipId)+"/history";
 const participation="/tpo/students/"+encodeURIComponent(student.membershipId)+"/participation";
 return <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onMouseDown={event=>{
   if(event.target===event.currentTarget)onClose();
 }}>
  <aside role="dialog" aria-modal="true" aria-label={"Student panel for "+student.displayName}
   className="h-full w-full max-w-xl overflow-y-auto bg-background p-5 shadow-2xl">
   <header className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-4">
    <div><p className="text-xs text-muted-foreground">TPO · Student</p>
      <h2 className="text-xl font-bold">{student.displayName}</h2>
      <p className="text-sm text-body">{student.rollNumber??student.registrationNumber??"No roll number"} · {student.branchName}</p>
      <p className="text-xs text-muted-foreground">{student.cohortName} · {tpoStudentDisplayLabel(student.journeyState)}</p>
      <p className="mt-2 text-sm font-semibold">After college: {afterCollegeDisplay(recordedOutcome)}</p>
    </div>
    <button type="button" autoFocus className="min-h-10 rounded border border-border px-3" onClick={onClose}>
      Close panel
    </button>
   </header>
   <nav aria-label="Student panel pages" className="mt-4 flex flex-wrap gap-2">
    {tabs.map(t=><button key={t} type="button" onClick={()=>void chooseTab(t)}
      aria-current={tab===t?"page":undefined}
      className={"min-h-10 rounded border px-3 text-sm "+(tab===t?"border-primary bg-primary-subtle":"border-border")}>{t}
       {t==="Requests"&&detail?.requests.some(row=>row.status==="PENDING")?
       " ("+detail.requests.filter(row=>row.status==="PENDING").length+" waiting)":""}
      </button>)}
   </nav>
   <div className="mt-5 space-y-4 text-sm">
    {tab==="Profile"?<>
      <h3 className="font-semibold">Recorded learner facts</h3>
      <dl className="grid grid-cols-2 gap-3">
       {[
        ["Program",student.programName],["Branch",student.branchName],
        ["Batch",student.cohortName],["Roll number",student.rollNumber??"Not recorded"],
        ["CGPA",student.cgpa??"Not recorded"],["Active backlogs",student.activeBacklogs??"Not recorded"],
        ["Past backlogs",student.pastBacklogs??"Not recorded"],
        ["After college",afterCollegeDisplay(recordedOutcome)],
        ["Stage",tpoStudentDisplayLabel(student.journeyState)],
        ["Profile check",student.verification.status==="UNKNOWN"?"Verification unavailable":tpoStudentDisplayLabel(student.verification.status)],
        ["Placements decision",tpoStudentDisplayLabel(student.participationStatus)],
        ["Offers waiting on their answer",student.offersAwaitingAnswer],
        ["Prep %","Not recorded"],
        ["Registration",student.registrationChoice??"Not recorded"],
       ].map(([label,value])=><div key={String(label)} className="rounded border border-border p-3">
        <dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd>
       </div>)}
      </dl>
      <h3 className="font-semibold">Needs attention</h3>
      {attention.length?<ul className="list-disc space-y-1 pl-5">{attention.map(item=><li key={item}>{item}</li>)}</ul>
       :<p>No attention flags derived from the current roster evidence.</p>}
      {detail?.requests.filter(row=>row.status==="PENDING").length?
       <p role="status" className="text-sm font-semibold">{detail.requests.filter(row=>row.status==="PENDING").length} student request(s) waiting for a decision.</p>:null}
      {student.participationReason?<div className="space-y-1 rounded border border-border p-3">
       <p className="font-semibold">Placement eligibility decision</p>
       <p>{student.participationReason}</p>
       <p className="text-xs text-muted-foreground">Set at {student.participationLevel??"placement"} level
        {student.participationDecidedAt?" · "+when(student.participationDecidedAt.toString()):""}</p>
      </div>:null}
      <Link href={participation} className="inline-flex min-h-10 items-center text-primary-text underline">Placement eligibility</Link>
      <Link href={"/tpo/team?about="+encodeURIComponent("STUDENT:"+student.membershipId)}
        className="ml-3 inline-flex min-h-10 items-center text-primary-text underline">Discuss with team</Link>
    </>:null}
    {tab==="Placement"?<>
      <h3 className="font-semibold">Placement journey</h3>
      <dl className="grid grid-cols-2 gap-3">
       {[
        ["Participation",tpoStudentDisplayLabel(student.participationStatus)],["Applications",student.applicationCount],
        ["Active applications",student.activeApplicationCount],["Offers",student.offerCount],
        ["Accepted offers",student.acceptedOfferCount],["Best so far",student.bestCompany?
         student.bestCompany+": "+tpoStudentDisplayLabel(student.bestSoFar):tpoStudentDisplayLabel(student.bestSoFar)],
       ].map(([label,value])=><div key={String(label)} className="rounded border border-border p-3">
        <dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd>
       </div>)}
      </dl>
      <h3 className="font-semibold">Applications</h3>
      {detail&&!detail.applications?.length?<p>No recorded placement applications.</p>:null}
      {detail?.applications?.map(row=><div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border p-3">
        <span>{row.title} · {row.status.replaceAll("_"," ")}</span>
        <Link href={"/tpo/placements/jobs/"+encodeURIComponent(row.jobId)} className="min-h-10 text-primary-text underline">Open drive</Link>
      </div>)}
      <Link href={participation} className="inline-flex min-h-10 items-center text-primary-text underline">Manage placement participation</Link>
      <TpoStudentNudgePanel rows={[{id:student.membershipId,label:student.displayName,
       registered:student.registeredForPlacements}]}/>
    </>:null}
    {loading&&(tab==="Requests"||tab==="Notes"||tab==="History"||tab==="Placement")?<p role="status">Loading student records…</p>:null}
    {error?<div role="alert" className="space-y-2 text-error"><p>{error}</p>
     <button type="button" className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text" onClick={()=>void fetchDetail()}>Retry loading student details</button></div>:null}
    {tab==="Requests"?<>
      <h3 className="font-semibold">Requests</h3>
      {detail&&!detail.requests.length?<p>No placement requests recorded for this student.</p>:null}
      {detail?.requests.map(row=><article key={row.id} className="space-y-1 rounded border border-border p-3">
        <p className="font-semibold">{row.type.replaceAll("_"," ")} · {row.status}</p>
        <p className="text-xs text-muted-foreground">{row.job} · {when(row.requestedAt)}</p>
        <p>{row.reason}</p>{row.note?<p>Decision: {row.note}</p>:null}
        {row.status==="PENDING"?<TpoRequestDecisionControl
          requestId={row.id} requestType={row.type} expectedUpdatedAt={row.updatedAt}
          onSuccess={()=>void fetchDetail()}/>:null}
      </article>)}
      <Link href={"/tpo/students/requests?search="+encodeURIComponent(student.displayName)}
       className="inline-flex min-h-10 items-center text-primary-text underline">Review student&apos;s requests</Link>
    </>:null}
    {tab==="Notes"?<>
      <h3 className="font-semibold">Internal Notes</h3>
      <TpoStudentNoteEditor membershipIds={[student.membershipId]} afterSave={()=>void fetchDetail()}/>
      {detail?.studentNotes?.map(row=><article key={row.id} className="space-y-1 rounded border border-border p-3">
       <p>{row.note}</p><p className="text-xs text-muted-foreground">{when(row.createdAt)} · Author {row.authorUserId}</p>
      </article>)}
      {detail&&!detail.notes.length?<p>No private application notes recorded for this student.</p>:null}
      {detail?.notes.map(row=><article key={row.id} className="space-y-1 rounded border border-border p-3">
        <p>{row.body}</p>
        <p className="text-xs text-muted-foreground">{row.job} · {when(row.createdAt)}</p>
      </article>)}
      <Link href={history} className="inline-flex min-h-10 items-center text-primary-text underline">Open placement history</Link>
    </>:null}
    {detail?.truncated&&(tab==="Requests"||tab==="Notes"||tab==="History")?<p className="text-xs text-warning-text">
      Most recent records shown; open the full Requests or History page for older entries.
    </p>:null}
    {tab==="History"?<>
      <h3 className="font-semibold">Team and student activity</h3>
      {detail&&!detail.teamHistory?.length?<p>No recorded team actions for this student.</p>:null}
      <ol className="max-h-72 space-y-2 overflow-y-auto">{detail?.teamHistory?.map(row=><li key={row.id} className="rounded border border-border p-3">
       <p className="font-semibold">{row.summary}</p>
       <p className="mt-1 text-xs text-muted-foreground">{when(row.occurredAt)} · {row.eventType}</p>
      </li>)}</ol>
      <p>Open the tenant-authorized historical application, round result, offer and joining timeline.</p>
      <Link href={history} className="inline-flex min-h-10 items-center text-primary-text underline">View full placement history</Link>
    </>:null}
   </div>
   <footer className="mt-8 flex items-center justify-between border-t border-border pt-3">
    <button type="button" disabled={index<=0} onClick={()=>onNavigate(rows[index-1].membershipId)}
      className="min-h-10 rounded border border-border px-3 disabled:opacity-40">← Previous</button>
    <span className="text-xs text-muted-foreground">{index+1} of {rows.length} on this page</span>
    <button type="button" disabled={index<0||index>=rows.length-1}
      onClick={()=>onNavigate(rows[index+1].membershipId)}
      className="min-h-10 rounded border border-border px-3 disabled:opacity-40">Next →</button>
   </footer>
  </aside>
 </div>;
}
