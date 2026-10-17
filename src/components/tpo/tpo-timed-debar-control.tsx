"use client";
import {useRef,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import type {TpoTimedDebarRow} from "@/modules/placements/tpo-timed-debar-view-model";
const endpoint=(id:string)=>"/api/placements/tpo/students/"+encodeURIComponent(id)+"/debarments";
type Pending={action:"DEBAR"}|{action:"LIFT";id:string};
export function TpoTimedDebarControl({membershipId,initial}:{membershipId:string;initial:TpoTimedDebarRow[]}){
 const [rows,setRows]=useState(initial);
 const [reason,setReason]=useState("");
 const [liftReason,setLiftReason]=useState("");
 const [duration,setDuration]=useState<"DATE"|"DRIVES"|"MANUAL">("DATE");
 const [untilDate,setUntilDate]=useState("");
 const [untilDrives,setUntilDrives]=useState("1");
 const [confirm,setConfirm]=useState<Pending|null>(null);
 const [pending,setPending]=useState(false);
 const locked=useRef(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const active=rows.filter(row=>row.active);
 async function apply(){
  if(!confirm||locked.current)return;
  locked.current=true;setPending(true);setError("");setNotice("");
  const payload=confirm.action==="LIFT"
   ?{action:"LIFT",debarmentId:confirm.id,reason:liftReason.trim()}
   :{action:"DEBAR",reason:reason.trim(),
     untilDate:duration==="DATE"?untilDate:null,
     untilDrives:duration==="DRIVES"?Number(untilDrives):null};
  try{
   const result=await apiFetch<{rows:TpoTimedDebarRow[]}>(endpoint(membershipId),{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify(payload),
   });
   setRows(result.rows);setConfirm(null);setReason("");setLiftReason("");
   setNotice(confirm.action==="LIFT"?"Debarment lifted.":"Debarment saved.");
  }catch(e){setError(e instanceof Error?e.message:"Could not save this change. Please try again.");}
  finally{locked.current=false;setPending(false);}
 }
 return <section aria-label="Timed debarment" className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <h2 className="text-lg font-semibold">Debar until a date or for N drives</h2>
  <p className="text-sm text-body">A debarment blocks new placement applications until it expires or is lifted. Existing applications stay recorded.</p>
  {active.length>0?<p role="status" className="text-sm font-semibold">Debarred · {active.length} active restriction(s)</p>:null}
  <div className="space-y-3">
   <label className="grid gap-1 text-sm">Reason for Debar
    <textarea value={reason} rows={2} maxLength={500} onChange={e=>setReason(e.target.value)}
     className="rounded border border-border p-2"/></label>
   <label className="grid gap-1 text-sm">How long
    <select value={duration} onChange={e=>setDuration(e.target.value as "DATE"|"DRIVES"|"MANUAL")}
     className="min-h-11 rounded border border-border p-2">
     <option value="DATE">Until a date</option><option value="DRIVES">For N drives</option><option value="MANUAL">Until lifted</option>
    </select></label>
   {duration==="DATE"?<label className="grid gap-1 text-sm">Until date (IST)
    <input type="date" value={untilDate} onChange={e=>setUntilDate(e.target.value)}
     className="min-h-11 rounded border border-border p-2"/></label>:null}
   {duration==="DRIVES"?<label className="grid gap-1 text-sm">Number of drives
    <input type="number" min={1} max={10000} value={untilDrives} onChange={e=>setUntilDrives(e.target.value)}
     className="min-h-11 rounded border border-border p-2"/></label>:null}
   <button type="button" className="min-h-11 rounded border border-border px-3 font-semibold disabled:opacity-50"
    disabled={pending||active.length>0||reason.trim().length===0||duration==="DATE"&&!untilDate||
      duration==="DRIVES"&&(!Number.isInteger(Number(untilDrives))||Number(untilDrives)<1||Number(untilDrives)>10000)}
    onClick={()=>{setError("");setConfirm({action:"DEBAR"});}}>Review debarment</button>
   {active.length>0?<p className="text-xs text-muted-foreground">Lift the current debarment before creating another.</p>:null}
  </div>
  <div className="space-y-3">
   <h3 className="font-semibold">Debarment history</h3>
   {rows.length===0?<p>No timed debarment is recorded for this student.</p>:null}
   {rows.map(row=><article key={row.id} className="space-y-2 rounded border border-border p-3">
    <p className="break-words font-semibold">{row.active?"Active":"Ended"} · {row.reason}</p>
    <p className="text-sm text-body">{row.untilDate?"Until "+row.untilDate+" IST":row.untilDrives!==null
     ?"For "+row.untilDrives+" drives ("+row.drivesCounted+" counted)":"Until lifted"}</p>
    {row.liftedAt?<p className="text-sm">Lifted · {row.liftedReason??"No reason recorded"}</p>:null}
    {row.active?<div className="space-y-2">
     <label className="grid gap-1 text-sm">Reason for lifting
      <textarea value={liftReason} maxLength={500} onChange={e=>setLiftReason(e.target.value)}
       className="rounded border border-border p-2"/></label>
     <button type="button" disabled={pending||!liftReason.trim()}
      onClick={()=>{setError("");setConfirm({action:"LIFT",id:row.id});}}
      className="min-h-11 rounded border border-border px-3 font-semibold disabled:opacity-50">Review lift</button>
    </div>:null}
   </article>)}
  </div>
  <Dialog open={confirm!==null} onOpenChange={open=>{if(!open&&!pending)setConfirm(null);}}
   title={confirm?.action==="LIFT"?"Lift debarment":"Confirm debarment"}
   description={confirm?.action==="LIFT"
    ?"Lift this restriction and record the reason. The history remains available."
    :"This blocks new placement applications for the student. The reason and duration will be recorded."}
   footer={<><Button variant="secondary" disabled={pending} onClick={()=>setConfirm(null)}>Cancel</Button>
    <Button disabled={pending} onClick={()=>void apply()}>{pending?"Saving…":"Confirm"}</Button></>}>
   <p className="text-sm">The student&apos;s existing applications will remain recorded.</p>
  </Dialog>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
 </section>;
}
