"use client";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {useRef,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Disclosure} from "@/components/ui/disclosure";
import {InlineNotice} from "@/components/ui/inline-notice";
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
 return <section aria-label="Timed debarment" className="min-w-0 space-y-4 border-y border-border py-5">
  <h2 className="text-lg font-semibold">Debar until a date or for N drives</h2>
  <p className="text-sm text-body">A debarment blocks new placement applications until it expires or is lifted. Existing applications stay recorded.</p>
  {active.length>0?<p role="status" className="text-sm font-semibold">Debarred · {active.length} active restriction(s)</p>:null}
  <Disclosure title="Create debarment" defaultOpen={active.length===0} className="border-t border-border" contentClassName="space-y-3 px-2 pb-3">
   <label className="grid min-w-0 gap-1 text-sm">Reason for Debar
    <Textarea className="w-full min-w-0" value={reason} rows={2} maxLength={500} disabled={pending||active.length>0} onChange={e=>{setReason(e.target.value);setError("");}}
     /></label>
   <label className="grid min-w-0 gap-1 text-sm">How long
    <Select className="min-h-11 w-full min-w-0 md:min-h-9" disabled={pending||active.length>0} value={duration} onChange={e=>setDuration(e.target.value as "DATE"|"DRIVES"|"MANUAL")}
     >
     <option value="DATE">Until a date</option><option value="DRIVES">For N drives</option><option value="MANUAL">Until lifted</option>
    </Select></label>
   {duration==="DATE"?<label className="grid min-w-0 gap-1 text-sm">Until date (IST)
    <Input className="min-h-11 w-full min-w-0 md:min-h-9" disabled={pending||active.length>0} type="date" value={untilDate} onChange={e=>setUntilDate(e.target.value)}
     /></label>:null}
   {duration==="DRIVES"?<label className="grid min-w-0 gap-1 text-sm">Number of drives
    <Input className="min-h-11 w-full min-w-0 md:min-h-9" disabled={pending||active.length>0} type="number" min={1} max={10000} value={untilDrives} onChange={e=>setUntilDrives(e.target.value)}
     /></label>:null}
   <Button variant="primary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9"
    disabled={pending||active.length>0||reason.trim().length===0||duration==="DATE"&&!untilDate||
      duration==="DRIVES"&&(!Number.isInteger(Number(untilDrives))||Number(untilDrives)<1||Number(untilDrives)>10000)}
    onClick={()=>{setError("");setConfirm({action:"DEBAR"});}}>Review debarment</Button>
   {active.length>0?<p className="text-xs text-muted-foreground">Lift the current debarment before creating another.</p>:null}
  </Disclosure>
  <div className="min-w-0 space-y-3">
   <h3 className="font-semibold">Debarment history</h3>
   {rows.length===0?<p role="status" className="text-sm text-body">No timed debarment is recorded for this student.</p>:null}
   {rows.map(row=><article key={row.id} className="min-w-0 space-y-2 border-b border-border py-3">
    <p className="break-words font-semibold">{row.active?"Active":"Ended"} · {row.reason}</p>
    <p className="text-sm text-body">{row.untilDate?"Until "+row.untilDate+" IST":row.untilDrives!==null
     ?"For "+row.untilDrives+" drives ("+row.drivesCounted+" counted)":"Until lifted"}</p>
    {row.liftedAt?<p className="text-sm">Lifted · {row.liftedReason??"No reason recorded"}</p>:null}
    {row.active?<div className="min-w-0 space-y-2">
     <label className="grid min-w-0 gap-1 text-sm">Reason for lifting
      <Textarea className="w-full min-w-0" value={liftReason} maxLength={500} disabled={pending} onChange={e=>{setLiftReason(e.target.value);setError("");}}
       /></label>
     <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending||!liftReason.trim()}
      onClick={()=>{setError("");setConfirm({action:"LIFT",id:row.id});}}
      >Review lift</Button>
    </div>:null}
   </article>)}
  </div>
  <Dialog open={confirm!==null} onOpenChange={open=>{if(!open&&!pending)setConfirm(null);}}
   title={confirm?.action==="LIFT"?"Lift debarment":"Confirm debarment"}
   description={confirm?.action==="LIFT"
    ?"Lift this restriction and record the reason. The history remains available."
    :"This blocks new placement applications for the student. The reason and duration will be recorded."}
   footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={()=>setConfirm(null)}>Cancel</Button>
    <Button variant={confirm?.action==="DEBAR"?"danger":"primary"} className="min-h-11 w-full sm:w-auto md:min-h-9" loading={pending} disabled={pending} onClick={()=>void apply()}>{pending?"Saving…":"Confirm"}</Button>
   </div>}>
   <div className="min-w-0 space-y-2">
    <p className="text-sm">The student&apos;s existing applications will remain recorded.</p>
    <p className="break-words text-sm text-body">Reason: {confirm?.action==="LIFT"?liftReason.trim():reason.trim()}</p>
    {confirm?.action==="DEBAR"?<p className="text-sm text-body">{duration==="DATE"?"Until: "+untilDate+" IST":duration==="DRIVES"?"Drives: "+untilDrives:"Until lifted"}</p>:null}
    {error&&confirm?<InlineNotice tone="error" message={error}/>:null}
   </div>
  </Dialog>
  {error&&!confirm?<InlineNotice tone="error" message={error}/>:null}
  {notice?<InlineNotice tone="success" message={notice}/>:null}
 </section>;
}
