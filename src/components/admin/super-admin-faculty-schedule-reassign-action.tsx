"use client";

import {useId,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Button} from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {Select} from "@/components/ui/select";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

type FacultyChoice={membershipId:string;displayName:string};

/** SA-academics-people-85: timetable reassign is not the same as changing
 * a course teaching role. The backend skips conflicting upcoming sessions. */
export function SuperAdminFacultyScheduleReassignAction({
  sourceMembershipId,sourceName,candidates,truncated=false,
}:{
  sourceMembershipId:string;sourceName:string;
  candidates:readonly FacultyChoice[];truncated?:boolean;
}){
  const id=useId(),router=useRouter();
  const {pending,run}=useGuardedAction({busyLabel:"Reassigning..."});
  const [open,setOpen]=useState(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [replacementMembershipId,setReplacementMembershipId]=useState("");
  const [error,setError]=useState("");
  const [report,setReport]=useState<{total:number;reassigned:number;skippedConflicts:number}|null>(null);
  const choices=candidates.filter(person=>person.membershipId!==sourceMembershipId);
  const target=choices.find(item=>item.membershipId===replacementMembershipId);
  function submit(){
    if(!target||pending)return;
    void run(async()=>{
      setError("");setReport(null);
      try{
        const result=await apiFetch<{report:{total:number;reassigned:number;skippedConflicts:number}}>(
          "/api/admin/faculty/schedules/reassign",{
            method:"POST",headers:{"content-type":"application/json"},
            body:JSON.stringify({sourceMembershipId,replacementMembershipId,confirmed:true}),
          });
        setReport(result.report);
        setConfirmOpen(false);setOpen(false);
        router.refresh();
      }catch{
        setConfirmOpen(false);
        setError("The timetable transfer could not be completed. Verify both faculty accounts and reload before retrying.");
      }
    });
  }
  return <div className="space-y-2 print:hidden">
    <Button variant="secondary" size="md" className="min-h-11 md:min-h-9" disabled={pending||choices.length===0}
      onClick={()=>{setOpen(true);setError("");}}>
      Reassign class schedules
    </Button>
    {report?<Alert tone="success">
      Reassigned {report.reassigned} of {report.total} upcoming session(s).
      {report.skippedConflicts>0?" "+report.skippedConflicts+" conflicting session(s) kept with the original faculty.":""}
    </Alert>:null}
    {error?<Alert tone="error">{error}</Alert>:null}
    <Dialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}}
      title="Reassign class schedules"
      description={"Move future scheduled sessions from "+sourceName+" to another active faculty member. Conflicts are skipped, never double-booked."}
      footer={<>
        <Button variant="secondary" className="min-h-11 md:min-h-9" disabled={pending} onClick={()=>setOpen(false)}>Cancel</Button>
        <Button className="min-h-11 md:min-h-9" disabled={pending||!target} onClick={()=>{setOpen(false);setConfirmOpen(true);}}>Review transfer</Button>
      </>}>
      <label htmlFor={id} className="mb-2 block text-[var(--lms-font-sm)] font-semibold text-body">Replacement faculty</label>
      <Select id={id} className="min-h-11 w-full md:min-h-9"
        value={replacementMembershipId} onChange={event=>setReplacementMembershipId(event.target.value)}>
        <option value="">Select faculty</option>
        {choices.map(item=><option key={item.membershipId} value={item.membershipId}>{item.displayName}</option>)}
      </Select>
      {truncated?<p role="status" className="mt-2 text-xs text-muted-foreground">
        Only the first 500 active faculty choices are shown. Use the faculty roster filters to find other colleagues.
      </p>:null}
    </Dialog>
    <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
      title="Reassign upcoming class schedules?"
      description={sourceName+" → "+(target?.displayName??"faculty")+
        ". Only upcoming scheduled sessions without a target timetable conflict will be moved; audit history stays preserved."}
      confirmLabel="Reassign class schedules" pending={pending}
      confirmDisabled={!target}
      onConfirm={submit}/>
  </div>;
}
