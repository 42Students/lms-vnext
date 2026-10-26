"use client";
import Link from "next/link";
import {useEffect,useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";
import {InlineNotice} from "@/components/ui/inline-notice";
import { Disclosure } from "@/components/ui/disclosure";
import { TpoRoundCheckIn } from "./tpo-round-check-in";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";

import {
  PageHeader,
} from "@/components/ui/page-header";
import {
  StatusBadge,
} from "@/components/ui/status-badge";

import type {
  getTpoRoundDriveDay,
} from "@/modules/placements/tpo-round-drive-day-service";
import { TpoRoundResultRecorder } from "./tpo-round-result-recorder";
import { TpoBulkRoundResultRecorder } from "./tpo-bulk-round-result-recorder";
import {tpoDriveDayRoundLinks} from "@/modules/placements/tpo-drive-day-navigation-model";

type RoundData = Awaited<
  ReturnType<typeof getTpoRoundDriveDay>
>;

type RoundRow=RoundData["rows"][number];
function resolveGateRoll(rows:readonly RoundRow[],input:string):
 {kind:"MATCH";student:RoundRow}|{kind:"AMBIGUOUS";students:RoundRow[]}|{kind:"NONE"} {
  const value=input.trim().toLocaleLowerCase("en-IN");
  if(!value)return {kind:"NONE"};
  const normalize=(row:RoundRow)=>(row.rollNumber??"").trim().toLocaleLowerCase("en-IN");
  const exact=rows.filter(row=>normalize(row)===value);
  if(exact.length===1)return {kind:"MATCH",student:exact[0]!};
  if(exact.length>1)return {kind:"AMBIGUOUS",students:exact.slice(0,5)};
  if(value.length<3)return {kind:"NONE"};
  const partial=rows.filter(row=>normalize(row).startsWith(value)||normalize(row).endsWith(value));
  return partial.length===1?{kind:"MATCH",student:partial[0]!}:
   partial.length>1?{kind:"AMBIGUOUS",students:partial.slice(0,5)}:{kind:"NONE"};
}

function formatScheduledAt(
  value: Date | null,
): string {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value) + " IST";
}

function statusTone(
  status: string,
): "neutral" | "info" | "success" | "error" {
  if (
    status === "PRESENT" ||
    status === "DONE" ||
    status === "APPLIED"
  ) {
    return "success";
  }

  if (status === "ABSENT") {
    return "error";
  }

  if (
    status === "IN_INTERVIEW" ||
    status === "STAGED"
  ) {
    return "info";
  }

  return "neutral";
}

export function TpoRoundDriveDayReadOnly({
  data,
}: {
  data: RoundData;
}) {
  const destinations=tpoDriveDayRoundLinks(data.job.id,data.round.id);
  const router=useRouter();
  const locked=["CANCELLED","COMPLETED"].includes(data.round.status);
  const [gateInput,setGateInput]=useState("");
  const [rosterSearch,setRosterSearch]=useState("");
  const [gateError,setGateError]=useState("");
  const [gateSuccess,setGateSuccess]=useState("");
  const [gateCandidates,setGateCandidates]=useState<RoundRow[]>([]);
  const [gateTarget,setGateTarget]=useState<RoundRow|null>(null);
  const [gateBusy,setGateBusy]=useState(false);
  const lastSnapshotAt=useRef(Date.now());
  const [staleSnapshot,setStaleSnapshot]=useState(false);
  const [refreshFailed,setRefreshFailed]=useState(false);
  const refreshing=useRef(false);
  const [roomBusy,setRoomBusy]=useState<string|null>(null);
  const inFlightRef=useRef(false);
  const [pasteOpen,setPasteOpen]=useState(false);
  const [pasteText,setPasteText]=useState("");
  const [pasteBusy,setPasteBusy]=useState(false);
  const [pasteFeedback,setPasteFeedback]=useState("");
  const [pasteFailure,setPasteFailure]=useState("");
  // Only replace the last good roster after a scoped read succeeds.
  // A failed/redirected API poll leaves the operator's current rows intact.
  useEffect(()=>{
    lastSnapshotAt.current=Date.now();
    setStaleSnapshot(false);
    setRefreshFailed(false);
  },[data]);
  useEffect(()=>{
    const controller=new AbortController();
    const refresh=async()=>{
      if(refreshing.current||inFlightRef.current||pasteOpen||
         document.visibilityState!=="visible")return;
      refreshing.current=true;
      try{
        const response=await fetch("/api/placements/tpo/drive-day/"+
          encodeURIComponent(data.round.id)+"/refresh",{
          method:"GET",credentials:"same-origin",cache:"no-store",
          headers:{Accept:"application/json"},signal:controller.signal,
        });
        // 204 is the only success: login HTML or a transient API error must
        // never make an older server component replace the last good roster.
        if(response.status!==204)throw new Error("ROSTER_REFRESH_UNAVAILABLE");
        if(!controller.signal.aborted){
          setRefreshFailed(false);
          router.refresh();
        }
      }catch{
        if(!controller.signal.aborted){
          setRefreshFailed(true);
          setStaleSnapshot(true);
        }
      }finally{refreshing.current=false;}
    };
    const timer=window.setInterval(()=>{
      if(Date.now()-lastSnapshotAt.current>60_000)setStaleSnapshot(true);
      void refresh();
    },20_000);
    return ()=>{controller.abort();window.clearInterval(timer);};
  },[data.round.id,pasteOpen,router]);
  const shownRows=useMemo(()=>{
    const q=rosterSearch.trim().toLocaleLowerCase("en-IN");
    return q?data.rows.filter(row=>
      row.displayName.toLocaleLowerCase("en-IN").includes(q)||
      (row.rollNumber??"").toLocaleLowerCase("en-IN").includes(q)):data.rows;
  },[data.rows,rosterSearch]);
  const roomQueues=useMemo(()=>{
    const rooms=new Map<string,RoundRow[]>();
    for(const student of data.rows){
      const room=student.assignedRoom?.trim();
      if(!room)continue;
      const roster=rooms.get(room)??[];
      roster.push(student);rooms.set(room,roster);
    }
    return [...rooms.entries()].map(([room,roster])=>({
      room,
      waiting:roster.filter(row=>row.attendance==="PRESENT").length,
      inside:roster.filter(row=>row.attendance==="IN_INTERVIEW").length,
      inRoom:roster.filter(row=>row.attendance==="IN_INTERVIEW").sort((a,b)=>
        (a.slotStartsAt??"9999").localeCompare(b.slotStartsAt??"9999")||a.applicationId.localeCompare(b.applicationId)),
      next:roster.filter(row=>row.attendance==="PRESENT").sort((a,b)=>
        // Historical drive-day called the earliest booked slot first,
        // breaking ties by natural roll order and stable application ID.
        (a.slotStartsAt??"9999").localeCompare(b.slotStartsAt??"9999")||
        (a.rollNumber??"").localeCompare(b.rollNumber??"","en",{numeric:true})||
        a.applicationId.localeCompare(b.applicationId))[0]??null,
    })).sort((a,b)=>a.room.localeCompare(b.room));
  },[data.rows]);
  async function callNext(student:RoundRow,room:string){
    if(locked||inFlightRef.current||student.attendance!=="PRESENT")return;
    inFlightRef.current = true;setRoomBusy(room);setGateError("");setGateSuccess("");
    try{
      const response=await fetch("/api/placements/tpo/drive-day/"+
        encodeURIComponent(data.round.id)+"/check-in",{
        method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({confirmed:true,applicationId:student.applicationId,
          expectedAttendance:"PRESENT",status:"IN_INTERVIEW"}),
      });
      if(!response.ok)throw Error("Attendance changed. Refresh the room queue and retry.");
      const result:unknown=await response.json().catch(()=>null);
      if(!result||typeof result!=="object"||!("attendance" in result)||
        !result.attendance||typeof result.attendance!=="object"||
        !("status" in result.attendance)||result.attendance.status!=="IN_INTERVIEW")
        throw Error("Could not confirm the saved room call. Refresh before retrying.");
      setGateSuccess("Call next · "+room+": "+student.displayName+
        (student.rollNumber?" ("+student.rollNumber+")":"")+" marked in interview.");
      router.refresh();
    }catch(error){
      setGateError(error instanceof Error?error.message:"Unable to call the next candidate.");
    }finally{setRoomBusy(null);inFlightRef.current = false;}
  }
  function prepareGate(){
    if(locked||inFlightRef.current)return;
    setGateError("");setGateSuccess("");setGateCandidates([]);
    const text=gateInput.trim();
    if(!text){setGateError("Enter a roll number.");return;}
    const match=resolveGateRoll(data.rows,text);
    if(match.kind==="NONE"){
      setGateError("No student with roll number "+text+" is on this roster.");return;
    }
    if(match.kind==="AMBIGUOUS"){
      setGateCandidates(match.students);
      setGateError("Type more of the roll number.");return;
    }
    if(match.student.attendance==="PRESENT"){
      setGateSuccess(match.student.displayName+" is already present.");return;
    }
    if(!["WAITING","ABSENT"].includes(match.student.attendance)){
      setGateError("This student cannot be marked present from "+match.student.attendance+".");return;
    }
    setGateTarget(match.student);
  }
  async function markPresent(student:RoundRow):Promise<boolean>{
    if(locked||inFlightRef.current)return false;
    inFlightRef.current = true;setGateBusy(true);
    try{
      const response=await fetch(
        "/api/placements/tpo/drive-day/"+encodeURIComponent(data.round.id)+"/check-in",{
          method:"POST",credentials:"same-origin",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({confirmed:true,applicationId:student.applicationId,
            expectedAttendance:student.attendance,status:"PRESENT"}),
        },
      );
      if(!response.ok)throw Error("Attendance has changed or could not be saved. Refresh the round before retrying.");
      const confirmation:unknown=await response.json().catch(()=>null);
      if(!confirmation||typeof confirmation!=="object"||!("attendance" in confirmation)||
        !confirmation.attendance||typeof confirmation.attendance!=="object"||
        !("status" in confirmation.attendance)||confirmation.attendance.status!=="PRESENT")
        throw Error("Could not confirm that the present status was saved. Refresh and retry.");
      router.refresh();return true;
    }catch(error){
      setGateError(error instanceof Error?error.message:"Check-in failed.");
      return false;
    }finally{setGateBusy(false);inFlightRef.current = false;}
  }
  const pastePreview=useMemo(()=>{
    const pasteTokens=pasteText.split(/[\n,;]+/).map(value=>value.trim()).filter(Boolean);
    const matched:RoundRow[]=[];
    const unresolved:string[]=[];
    const unmatched:string[]=[];
    const ambiguous:string[]=[];
    let duplicates=0;
    const used=new Set<string>();
    for(const token of pasteTokens.slice(0,50)){
      const outcome=resolveGateRoll(data.rows,token);
      if(outcome.kind==="MATCH"){
        if(used.has(outcome.student.applicationId)){duplicates++;continue;}
        matched.push(outcome.student);used.add(outcome.student.applicationId);
      }else{
        unresolved.push(token);
        if(outcome.kind==="AMBIGUOUS")ambiguous.push(token);
        else unmatched.push(token);
      }
    }
    return {matched,unresolved,unmatched,ambiguous,duplicates,tooMany:pasteTokens.length>50};
  },[data.rows,pasteText]);
  async function markPasted(){
    if(inFlightRef.current)return;
    if(locked||pasteBusy||inFlightRef.current||pastePreview.tooMany||pastePreview.matched.length===0)return;
    setPasteBusy(true);inFlightRef.current = true;setPasteFailure("");setPasteFeedback("");
    let done=0,already=0;
    const failed=[...pastePreview.unresolved];
    try{
      for(const student of pastePreview.matched){
        if(student.attendance==="PRESENT"){already++;continue;}
        if(!["WAITING","ABSENT"].includes(student.attendance)){
          failed.push(student.rollNumber??student.displayName);continue;
        }
        try{
          const response=await fetch(
            "/api/placements/tpo/drive-day/"+encodeURIComponent(data.round.id)+"/check-in",{
              method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
              body:JSON.stringify({confirmed:true,applicationId:student.applicationId,
                expectedAttendance:student.attendance,status:"PRESENT"}),
            },
          );
          if(!response.ok)throw Error("Attendance changed");
          const saved:unknown=await response.json().catch(()=>null);
          if(!saved||typeof saved!=="object"||!("attendance" in saved)||
            !saved.attendance||typeof saved.attendance!=="object"||
            !("status" in saved.attendance)||saved.attendance.status!=="PRESENT")
            throw Error("Could not confirm the saved present state");
          done++;
        }catch{failed.push(student.rollNumber??student.displayName);}
      }
      setPasteText(failed.join("\n"));
      setPasteFeedback(done+" marked present"+(already>0?"; "+already+" already present":"")+
        (pastePreview.duplicates>0?"; "+pastePreview.duplicates+" duplicate entries skipped":"")+".");
      if(failed.length>0)setPasteFailure(
        failed.length+" roll number(s) were unmatched, ambiguous or could not be saved. Review the remaining lines.");
      router.refresh();
      if(failed.length===0)setPasteOpen(false);
    }finally{inFlightRef.current = false;setPasteBusy(false);}
  }
  const summary = [
    ["On roster", data.counts.total],
    ["Waiting", data.counts.waiting],
    ["Present", data.counts.present],
    ["In interview", data.counts.inInterview],
    ["Done", data.counts.done],
    ["Absent", data.counts.absent],
    ["Results staged", data.counts.stagedResults],
    ["Results applied", data.counts.appliedResults],
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Drive Day"
        title={data.companyName + " · " + data.round.name}
        description={
          data.job.title +
          " · Round-focused operational overview"
        }
        actions={
          <Link
            href={
              "/tpo/placements/jobs/" +
              encodeURIComponent(data.job.id)
            }
            className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-muted"
          >
            ← Back to job Drive Day
          </Link>
        }
      />


      {staleSnapshot?<div role="status" className="flex flex-wrap items-center justify-between gap-3">
        <InlineNotice tone="info" message={refreshFailed
          ?"Could not refresh the roster. Showing the last loaded details; check before editing."
          :"The last successful roster snapshot is over a minute old. Check that attendance is current before editing."}/>
        <Button type="button" variant="secondary" disabled={gateBusy||pasteBusy}
          onClick={()=>{setRefreshFailed(false);router.refresh();}}>Retry roster refresh</Button>
      </div>:null}
      <section aria-label="At the gate and in the rooms" data-testid="tpo.drive-day.prototype-summary"
        className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {([
         ["Here",data.counts.present+data.counts.inInterview+data.counts.done],
         ["Not here yet",data.counts.waiting],
         ["In interview now",data.counts.inInterview],
         ["Done",data.counts.done],
         ["Absent",data.counts.absent],
        ] as const).map(([label,count])=>
         <div key={label} className="min-w-0 rounded-lg border border-border bg-surface-secondary px-4 py-3">
          <strong className="block text-xl tabular-nums text-foreground">{count}</strong>
          <span className="mt-1 block text-xs text-body">{label}</span>
         </div>)}
        {data.counts.unknownAttendance>0?<p role="status" className="col-span-full text-sm text-warning-text">
          {data.counts.unknownAttendance} attendance states cannot be classified.
          They are not included in these categories.
        </p>:null}
      </section>
      <section aria-label="Gate quick check-in" className="min-w-0 space-y-3 border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Gate check-in</h2>
            <p className="text-sm text-body">Find a candidate by exact roll number or an unambiguous prefix/suffix.</p>
          </div>
          <Button type="button" variant="secondary" disabled={locked||gateBusy||pasteBusy}
            onClick={()=>{setPasteFailure("");setPasteFeedback("");setPasteOpen(true);}}>
            Paste a list of roll numbers
          </Button>
        </div>
        <form className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-end"
          onSubmit={event=>{event.preventDefault();prepareGate();}}>
          <label className="min-w-0 flex-1 text-sm font-semibold text-body">
            Roll number
            <Input autoFocus type="search" autoComplete="off" value={gateInput}
              disabled={locked||gateBusy||pasteBusy} placeholder="Roll number, then Enter"
              onChange={event=>{setGateInput(event.target.value);setGateError("");setGateCandidates([]);}}
              className="mt-1" />
          </label>
          <Button type="submit" disabled={locked||gateBusy||pasteBusy||!gateInput.trim()}>
            Mark present
          </Button>
        </form>
        {locked?<InlineNotice tone="info" message="This round is locked. Attendance changes are unavailable."/>:null}
        {gateError?<InlineNotice tone="error" message={gateError} onDismiss={()=>setGateError("")}/>:null}
        {gateCandidates.length>0?<ul className="text-xs text-body">
          {gateCandidates.map(row=><li key={row.applicationId}>{row.rollNumber??"—"} · {row.displayName}</li>)}
        </ul>:null}
        {gateSuccess?<InlineNotice tone="success" message={gateSuccess} onDismiss={()=>setGateSuccess("")}/>:null}
        {pasteFeedback?<InlineNotice tone="success" message={pasteFeedback} onDismiss={()=>setPasteFeedback("")}/>:null}
        {pasteFailure?<InlineNotice tone="error" message={pasteFailure} onDismiss={()=>setPasteFailure("")}/>:null}
        {data.rows.some(student=>student.attendance==="PRESENT")?
         <section aria-label="Here and waiting for a room" className="mt-4 border-t border-border pt-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Here and waiting</h3>
          <ul className="mt-2 divide-y divide-border text-sm">
           {data.rows.filter(student=>student.attendance==="PRESENT").slice(0,5).map(student=>
            <li key={student.applicationId} className="flex min-w-0 items-center justify-between gap-2 py-2">
             <span className="break-words font-semibold text-foreground">{student.displayName}</span>
             <span className="text-xs text-body">{student.rollNumber??"Roll number unavailable"}</span>
            </li>)}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
           Arrival timestamps are not recorded by this view; the list shows current present states, not a claimed arrival order.
          </p>
         </section>:null}
      </section>
      {roomQueues.length>0?<section aria-label="Room queues" className="space-y-3 border-b border-border pb-4">
        <h2 className="text-base font-semibold text-foreground">Room queues</h2>
        <p className="text-sm text-body">
          Call the next checked-in candidate for a room. A call records In interview
          with a fresh attendance check; candidates already in a room are excluded.
        </p>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roomQueues.map(queue=><article key={queue.room}
            aria-label={"Panel room "+queue.room} className="min-w-0 space-y-3 rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
             <h3 className="break-words font-bold text-foreground">{queue.room}</h3>
             <p className="text-xs text-muted-foreground">{queue.waiting} waiting · {queue.inside} in the room</p>
            </div>
            <div aria-label="In the room" className="space-y-3">
             <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">In the room</h4>
             {queue.inRoom.length?queue.inRoom.slice(0,3).map(student=><div key={student.applicationId}
                className="min-w-0 rounded-lg border border-border p-3">
               <p className="break-words text-lg font-semibold text-foreground">{student.displayName}</p>
               <p className="mt-1 text-xs text-body">
                {student.rollNumber??"Roll unavailable"} · Slot {student.slotStartsAt?
                 new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit"}).format(new Date(student.slotStartsAt))+" IST":
                 "time unavailable"}
               </p>
               <TpoRoundResultRecorder roundId={data.round.id}
                round={{kind:data.round.kind,status:data.round.status}} row={student}/>
               <TpoRoundCheckIn roundId={data.round.id} applicationId={student.applicationId}
                displayName={student.displayName} attendance={student.attendance}
                roundStatus={data.round.status} rollNumber={student.rollNumber}/>
             </div>):<p className="text-sm text-body">No candidate currently recorded in this room.</p>}
             {queue.inRoom.length>3?<p className="text-xs text-warning-text">
               Showing three of {queue.inRoom.length} candidates marked in interview.
               Check the full roster to resolve overlapping room occupancy.
             </p>:null}
            </div>
            <section aria-label="Next up" className="min-w-0 space-y-2 border-t border-border pt-3">
             <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Next up</h4>
             <p className="break-words text-sm font-semibold text-foreground">
              {queue.next?queue.next.displayName+" · "+(queue.next.rollNumber??"Roll unavailable"):
               "No checked-in candidate waiting"}
             </p>
             <Button type="button" size="sm" variant="secondary"
              disabled={locked||gateBusy||pasteBusy||roomBusy!==null||!queue.next}
              onClick={()=>{if(queue.next)void callNext(queue.next,queue.room);}}>
              {roomBusy===queue.room?"Calling…":"Call next · "+queue.room}
             </Button>
            </section>
          </article>)}
        </div>
        <p className="text-xs text-muted-foreground">
          Within each room, available roll numbers determine the queue order.
          Unassigned candidates are not automatically called into a room.
        </p>
      </section>:null}
      <section aria-label="Not here yet" className="min-w-0 space-y-3 rounded-xl border border-border bg-surface p-4">
       <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
         Not here yet · {data.counts.waiting}
        </h2>
        <Link href={destinations.noShows} className="inline-flex min-h-9 items-center text-sm font-semibold text-link underline">
         Review explicit absences
        </Link>
       </div>
       {data.counts.waiting>0?<ul className="divide-y divide-border">
        {data.rows.filter(row=>row.attendance==="WAITING").slice(0,8).map(student=>
         <li key={student.applicationId} className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-2">
          <div className="min-w-0">
           <p className="break-words text-sm font-semibold text-foreground">{student.displayName}</p>
           <p className="mt-1 text-xs text-muted-foreground">
            {student.rollNumber??"Roll not recorded"} · Booked slot:
            {" "}{student.slotStartsAt?new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit"}).format(new Date(student.slotStartsAt))+" IST":"Not assigned"}
           </p>
          </div>
          <TpoRoundCheckIn roundId={data.round.id} applicationId={student.applicationId}
           displayName={student.displayName} attendance={student.attendance}
           roundStatus={data.round.status} rollNumber={student.rollNumber}/>
         </li>)}
       </ul>:<p className="text-sm text-body">No students have a recorded waiting status.</p>}
       {data.counts.waiting>8?<p className="text-xs text-muted-foreground">
         Showing eight of {data.counts.waiting} waiting candidates. The full roster is below.
       </p>:null}
       <p className="text-xs text-muted-foreground">
        No one is automatically marked absent at a fixed clock time.
        Individual absent actions require confirmation and a current attendance state.
       </p>
      </section>
      <p className="text-xs leading-5 text-muted-foreground">
       Results entered here are staged; learners are told only after a confirmed apply action in the
       <Link href={destinations.results} className="ml-1 font-semibold text-link underline">round results workspace</Link>.
       Absent notifications are only confirmed when the attendance action reports successful delivery.
      </p>
      <section aria-label="Round progress">
        <h2 className="mb-3 text-base font-semibold text-foreground">
          Applicant progress
        </h2>

        <div className="grid overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border md:grid-cols-2 lg:grid-cols-4">
          {summary.slice(0,6).map(([label, count], index) => (
            <div
              key={label}
              className={"min-w-0 p-3 sm:p-4 " +
                (index < 6 ? "border-b border-border " : "") +
                (index % 2 === 0 ? "border-r border-border " : "") +
                (index < 4 ? "lg:border-b " : "lg:border-b-0 ") +
                (index % 4 !== 3 ? "lg:border-r " : "lg:border-r-0 ")}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                {count}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Results staged: {data.counts.stagedResults} · Results applied: {data.counts.appliedResults}
        </p>
        {data.counts.unknownAttendance > 0 ? (
          <p
            role="status"
            className="mt-3 text-sm text-body"
          >
            {data.counts.unknownAttendance} roster
            entries have an unrecognized attendance state.
          </p>
        ) : null}

        <p className="mt-3 text-xs text-muted-foreground">
          Attendance counts reflect the current persisted
          Drive Day state. Staged results are not final
          applied outcomes.
          {" "}
          {data.counts.noResult}
          {" "}
          applicants have no current result record.
        </p>
      </section>

      <nav aria-label="Round operational actions" className="flex min-w-0 flex-col items-stretch gap-2 border-b border-border pb-4 sm:flex-row sm:flex-wrap sm:items-center">
        <Link href={destinations.results} className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-[650] text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Review round results →</Link>
        <Link href={destinations.schedule} className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Candidate schedule →</Link>
        <Link href={destinations.noShows} className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Review explicit no-shows →</Link>
        <a href={"/api/placements/drive-day/" + encodeURIComponent(data.round.id) + "/attendance/export"}
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
          Export round attendance (CSV)
        </a>
      </nav>
      <p className="text-xs leading-5 text-muted-foreground">Current roster only; waiting and unmarked states remain explicit.</p>

      <section className="border-b border-border pb-6">
        <h2 className="text-base font-semibold text-foreground">
          Round details
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone="info">
            {data.round.kind.replaceAll("_", " ")}
          </StatusBadge>

          <StatusBadge
            tone={
              data.round.status === "COMPLETED"
                ? "success"
                : "neutral"
            }
          >
            {data.round.status.replaceAll("_", " ")}
          </StatusBadge>

          <StatusBadge>
            Audited stage / apply
          </StatusBadge>
        </div>

        <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="font-semibold text-muted-foreground">
              Job
            </dt>
            <dd className="mt-1 text-foreground">
              {data.job.title}
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-muted-foreground">
              Company
            </dt>
            <dd className="mt-1 text-foreground">
              {data.companyName}
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-muted-foreground">
              Scheduled time
            </dt>
            <dd className="mt-1 text-foreground">
              {formatScheduledAt(
                data.round.scheduledAt,
              )}
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-muted-foreground">
              Venue
            </dt>
            <dd className="mt-1 text-foreground">
              {data.round.venue ?? "Not specified"}
            </dd>
          </div>
        </dl>
      </section>

      <section
        aria-label="Round applicant roster"
        className="overflow-hidden border-t border-border"
      >
        <div className="border-b border-border py-4">
          <h2 className="text-base font-semibold text-foreground">
            Applicants in this round
          </h2>
          <p className="mt-1 text-sm text-body">
            Shortlisted applicants who reached this round
            under the existing previous-round progression
            rules. Only student names and roll numbers are
            displayed.
          </p>
        </div>

        <label className="mb-3 block max-w-xl text-sm font-semibold text-body">
          Search by student name or roll number
          <Input type="search" value={rosterSearch}
            onChange={event=>setRosterSearch(event.target.value)}
            placeholder="Search roster" className="mt-1"/>
        </label>
        <p role="status" className="mb-3 text-xs text-muted-foreground">
          Showing {shownRows.length} of {data.rows.length} roster students.
        </p>
        <DataTable
          caption="Applicants in this round"
          rows={shownRows}
          getRowKey={student=>student.applicationId}
          empty={<EmptyState title="No eligible applicants currently appear in this round’s roster."
            action={<Link href={destinations.schedule} className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Candidate schedule →</Link>} />}
          columns={[
            {key:"student",header:"Student",mobilePriority:"primary" as const,
              cell:(student:(typeof data.rows)[number])=>student.displayName},
            {key:"roll",header:"Roll number",mobilePriority:"secondary" as const,
              cell:(student:(typeof data.rows)[number])=>student.rollNumber??"—"},
            {key:"application",header:"Application",mobilePriority:"secondary" as const,
              cell:(student:(typeof data.rows)[number])=><StatusBadge>{student.applicationStatus}</StatusBadge>},
            {key:"attendance",header:"Round attendance",mobilePriority:"action" as const,
              cell:(student:(typeof data.rows)[number])=><div className="min-w-0 space-y-2">
                <span className="block text-xs font-semibold text-body md:hidden">Round attendance</span>
                <StatusBadge tone={statusTone(student.attendance)}>
                  {student.attendance.replaceAll("_"," ")}
                </StatusBadge>
                <TpoRoundCheckIn
                  roundId={data.round.id}
                  applicationId={student.applicationId}
                  displayName={student.displayName}
                  attendance={student.attendance}
                  roundStatus={data.round.status}
                />
              </div>},
            {key:"result",header:"Latest result",mobilePriority:"action" as const,
              cell:(student:(typeof data.rows)[number])=><div className="min-w-0 space-y-2">
                <span className="block text-xs font-semibold text-body md:hidden">Latest result</span>
                {student.resultStatus && student.resultOutcome ?
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={statusTone(student.resultStatus)}>
                      {student.resultStatus}
                    </StatusBadge>
                    <span className="text-body">{student.resultOutcome}</span>
                  </div>
                 :<span className="text-muted-foreground">No result recorded</span>}
                <TpoRoundResultRecorder
                  roundId={data.round.id}
                  round={{kind:data.round.kind,status:data.round.status}}
                  row={student}
                />
              </div>},
          ]}
        />
      </section>

      <ConfirmDialog open={gateTarget!==null}
        onOpenChange={next=>{if(!next&&!gateBusy)setGateTarget(null);}}
        title="Mark present?"
        {...(gateTarget ? { description: "Confirm check-in for "+gateTarget.displayName+" ("+(gateTarget.rollNumber??"no roll")+")?" } : {})}
        confirmLabel="Mark present" cancelLabel="Cancel" confirmVariant="primary" pending={gateBusy}
        onConfirm={()=>{
          const student=gateTarget;
          if(!student)return;
          void markPresent(student).then(ok=>{
            if(ok){setGateTarget(null);setGateInput("");setGateSuccess(student.displayName+" marked present.");}
          });
        }}/>
      <Dialog open={pasteOpen} dismissible={!pasteBusy}
        onOpenChange={next=>{if(!pasteBusy)setPasteOpen(next);}}
        title="Paste a list of roll numbers"
        description="Enter one roll number per line. Only unambiguous roster matches can be checked in."
        footer={<div className="flex w-full flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" disabled={pasteBusy}
            onClick={()=>setPasteOpen(false)}>Cancel</Button>
          <Button type="button" disabled={locked||pasteBusy||pastePreview.tooMany||
            pastePreview.matched.filter(row=>row.attendance!=="PRESENT").length===0}
            loading={pasteBusy} onClick={()=>void markPasted()}>
            Mark {pastePreview.matched.length} present
          </Button>
        </div>}>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-body">
            Roll numbers
            <Textarea rows={5} autoFocus value={pasteText} disabled={pasteBusy}
              onChange={event=>setPasteText(event.target.value)} className="mt-1"
              placeholder="Paste one roll number per line"/>
          </label>
          <p className="text-xs text-body">
            {pastePreview.matched.length} matched · {pastePreview.unmatched.length} unmatched · {pastePreview.ambiguous.length} ambiguous · {pastePreview.duplicates} duplicates skipped.
          </p>
          {pastePreview.tooMany?<InlineNotice tone="error" message="Paste at most 50 roll numbers per batch."/>:null}
          {pasteFailure?<InlineNotice tone="error" message={pasteFailure}/>:null}
          {pasteFeedback?<InlineNotice tone="success" message={pasteFeedback}/>:null}
          {pastePreview.unresolved.length>0?<p className="text-xs text-error">
            Type more of the roll number for ambiguous entries. Unresolved: {pastePreview.unresolved.slice(0,5).join(", ")}
          </p>:null}
        </div>
      </Dialog>
      <Disclosure title="Bulk stage round results" contentClassName="pt-3">
        <TpoBulkRoundResultRecorder
          roundId={data.round.id}
          round={{ kind: data.round.kind, status: data.round.status }}
          rows={data.rows}
        />
      </Disclosure>
      <details className="border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
        <summary className="min-h-11 cursor-pointer font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">About round results</summary>
        <p className="max-w-3xl pb-2">
          TPO operators can stage a PASS (shortlisted), FAIL (not selected),
          HOLD (waitlisted) or ABSENT outcome here. Staging is not publication:
          only completed rounds permit explicit, audited apply. Existing
          coordinator attendance controls remain separate. Bulk initial-result
          staging processes entries in individual audited transactions and may
          partly succeed; neither stage nor bulk stage implies an offer or
          final hiring selection.
        </p>
      </details>
    </div>
  );
}
