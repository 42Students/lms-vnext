"use client";
import {useMemo,useState} from "react";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {recruiterJoiningReportMessage,recruiterJoiningReportSchema}
 from "@/modules/placements/recruiter-joining-report-model";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";

export function RecruiterJoiningReportForm({
 collegeId,jobId,jobTitle,offerId,candidate,currentOutcome,
}:{collegeId:string;jobId:string;jobTitle:string;offerId:string;
 candidate:string;currentOutcome:string|null;}){
 const [status,setStatus]=useState<"JOINED"|"DEFERRED"|"DID_NOT_JOIN">("JOINED");
 const [reportedDate,setReportedDate]=useState("");
 const [reason,setReason]=useState("");
 const [confirm,setConfirm]=useState(false);
 const input={status,reportedDate,reason};
 const ready=recruiterJoiningReportSchema.safeParse(input).success&&confirm;
 const message=useMemo(()=>{
  if(!recruiterJoiningReportSchema.safeParse(input).success)return "";
  return recruiterJoiningReportMessage({offerId,candidate,drive:jobTitle,...input});
 },[offerId,candidate,jobTitle,status,reportedDate,reason]);
 return <form method="post" action="/api/placements/recruiter/conversations/open"
  aria-label={"Report joining for "+candidate}
  className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <input type="hidden" name="collegeId" value={collegeId}/>
  <input type="hidden" name="jobId" value={jobId}/>
  <input type="hidden" name="message" value={message}/>
  <Heading level={4} className="text-foreground">{candidate}</Heading>
  <p className="text-xs text-muted-foreground">
   {currentOutcome&&currentOutcome!=="PENDING"?"Official outcome: "+currentOutcome.replaceAll("_"," "):
    "Official joining status has not been recorded."}
  </p>
  <label className="grid gap-1 text-sm font-medium text-foreground">
   Reported outcome
   <Select value={status} onChange={event=>{setStatus(event.target.value as typeof status);setConfirm(false);}}
    className="min-h-11">
    <option value="JOINED">Joined</option>
    <option value="DEFERRED">Deferred</option>
    <option value="DID_NOT_JOIN">Did not join</option>
   </Select>
  </label>
  {status!=="DID_NOT_JOIN"?<label className="grid gap-1 text-sm font-medium text-foreground">
   {status==="JOINED"?"Actual joining date":"Revised joining date"}
   <Input type="date" required value={reportedDate} onChange={event=>{setReportedDate(event.target.value);setConfirm(false);}}/>
  </label>:null}
  <label className="grid gap-1 text-sm font-medium text-foreground">
   {status==="DID_NOT_JOIN"?"Reason for not joining":"Notes (optional)"}
   <Textarea rows={2} value={reason} required={status==="DID_NOT_JOIN"} maxLength={1000}
    onChange={event=>{setReason(event.target.value);setConfirm(false);}}/>
  </label>
  <label className="flex min-h-11 items-start gap-2 py-2 text-xs text-body">
   <Checkbox className="mt-1" checked={confirm} onChange={event=>setConfirm(event.target.checked)}/>
   Send this report to the college placement cell for verification. It will not overwrite the official outcome.
  </label>
  <Button variant="secondary" size="md" type="submit" disabled={!ready}>
   Send joining report
  </Button>
 </form>;
}
