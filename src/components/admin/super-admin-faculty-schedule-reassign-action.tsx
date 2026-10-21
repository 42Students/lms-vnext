"use client";

import {useId,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Button} from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
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
  const [facultySearch,setFacultySearch]=useState("");
  const [error,setError]=useState("");
  const [retirementBusy,setRetirementBusy]=useState(false);
  const [retirementOpen,setRetirementOpen]=useState(false);
  const [retirementImpact,setRetirementImpact]=useState<{
    canEnd:boolean;courses:number;schedules:number;projects:number;otherRoles:boolean;
  }|null>(null);
  const [retirementMessage,setRetirementMessage]=useState("");
  const retirementUrl="/api/admin/faculty/memberships/"+encodeURIComponent(sourceMembershipId)+"/retire";
  async function inspectRetirement(){
    if(retirementBusy||pending)return;
    setRetirementBusy(true);setRetirementMessage("");setRetirementImpact(null);
    try{
      const impact=await apiFetch<{canEnd:boolean;courses:number;schedules:number;projects:number;otherRoles:boolean}>(
        retirementUrl,{cache:"no-store"});
      setRetirementImpact(impact);setRetirementOpen(true);
    }catch{
      setRetirementMessage("Unable to check active teaching, sessions and projects. No faculty membership was changed.");
    }finally{setRetirementBusy(false);}
  }
  async function retireFaculty(){
    if(retirementBusy||!retirementImpact?.canEnd)return;
    setRetirementBusy(true);setRetirementMessage("");
    try{
      const result=await apiFetch<{status:string}>(retirementUrl,{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({confirmed:true}),
      });
      if(result.status!=="ENDED")throw Error("No confirmed removal");
      setRetirementOpen(false);setRetirementImpact(null);
      setRetirementMessage("Faculty membership ended; historical identity, assignments and audit records were retained.");
      router.refresh();
    }catch{
      setRetirementOpen(false);
      setRetirementMessage("Faculty removal was not confirmed. Assignments may have changed; review again before retrying.");
    }finally{setRetirementBusy(false);}
  }
  const [report,setReport]=useState<{total:number;reassigned:number;skippedConflicts:number}|null>(null);
  const choices=candidates.filter(person=>person.membershipId!==sourceMembershipId);
  const target=choices.find(item=>item.membershipId===replacementMembershipId);
  const visibleChoices=choices.filter(item=>item.displayName.toLocaleLowerCase("en-IN").includes(facultySearch.trim().toLocaleLowerCase("en-IN")));
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
      }catch(cause){
        setConfirmOpen(false);
        const detail=cause instanceof Error?cause.message:"";
        setError("The timetable transfer could not be completed for "+sourceName+" → "+target.displayName+". "+
          (detail.includes("CONFLICT")?"A timetable conflict was reported. Review the faculty schedules before retrying.":
           "Verify both faculty accounts and reload before retrying."));
      }
    });
  }
  return <div className="min-w-0 space-y-[var(--lms-space-3)] print:hidden">
    <Button variant="secondary" size="md" className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={pending||choices.length===0}
      onClick={()=>{setOpen(true);setError("");setReport(null);setFacultySearch("");}}>
      Reassign class schedules
    </Button>
    {report?<Alert tone={report.skippedConflicts>0?"warning":"success"} className="max-w-prose">
      Reassigned {report.reassigned} of {report.total} upcoming session(s).
      {report.skippedConflicts>0?
        " "+report.skippedConflicts+" conflicting session(s) still belong to the original faculty. Do not remove or end that faculty membership until those sessions and any other active teaching assignments are reassigned.":
        " Schedule transfer recorded. Before removing a faculty membership, check its remaining teaching, project and course assignments and the audit history."}
    </Alert>:null}
    <Button variant="danger" size="md" className="min-h-11 w-full md:min-h-9 md:w-auto"
      disabled={pending||retirementBusy} onClick={()=>void inspectRetirement()}>
      {retirementBusy?"Checking assignments…":"Remove faculty"}
    </Button>
    {retirementMessage?<Alert tone={retirementMessage.startsWith("Faculty membership ended")?"success":"warning"}>{retirementMessage}</Alert>:null}
    <ConfirmDialog open={retirementOpen}
      onOpenChange={next=>{if(!retirementBusy)setRetirementOpen(next);}}
      title={"Remove "+sourceName+" from this college?"}
      description={retirementImpact?
        "Active course assignments: "+retirementImpact.courses+
        ". Upcoming class sessions: "+retirementImpact.schedules+
        ". Active project assignments: "+retirementImpact.projects+
        (retirementImpact.otherRoles?". This membership also has other roles.":"")+
        (retirementImpact.canEnd?
          " Ending the college membership preserves their shared account and historical records; the change is audited.":
          " Removal is blocked. Reassign or end every active assignment and other role first."):
        "Checking active assignments…"}
      confirmLabel="End faculty membership" confirmVariant="danger"
      pending={retirementBusy} confirmDisabled={!retirementImpact?.canEnd}
      onConfirm={()=>void retireFaculty()}/>
    {error?<Alert tone="error">{error}</Alert>:null}
    <Dialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}} dismissible={!pending}
      title="Reassign class schedules"
      description={"Moves every not-yet-started session from "+sourceName+" to another faculty member when no timetable conflict exists. Conflicting sessions remain with the original faculty and must be resolved separately; membership is never deleted."}
      footer={<div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
        <Button variant="secondary" className="min-h-11 md:min-h-9" disabled={pending} onClick={()=>setOpen(false)}>Close</Button>
        <Button className="min-h-11 md:min-h-9" disabled={pending||!target} onClick={()=>{setOpen(false);setConfirmOpen(true);}}>Reassign</Button>
      </div>}>
      <label className="mb-3 grid gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)]">
        Search replacement faculty
        <Input type="search" value={facultySearch} disabled={pending} placeholder="Search active faculty"
          onChange={event=>setFacultySearch(event.target.value)} className="min-h-11 md:min-h-9"/>
      </label>
      <label htmlFor={id} className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Replacement faculty</label>
      <Select id={id} className="min-h-11 w-full md:min-h-9"
        value={replacementMembershipId} onChange={event=>setReplacementMembershipId(event.target.value)}>
        <option value="">Select faculty</option>
        {target&&!visibleChoices.some(item=>item.membershipId===target.membershipId)?
          <option value={target.membershipId}>{target.displayName} (selected)</option>:null}
        {visibleChoices.map(item=><option key={item.membershipId} value={item.membershipId}>{item.displayName}</option>)}
      </Select>
      {visibleChoices.length===0?<p role="status" className="mt-2 text-sm text-muted-foreground">
        No matching faculty in the loaded roster. Try another name or change the roster filters.
      </p>:null}
      {truncated?<p role="status" className="mt-2 text-xs text-muted-foreground">
        Only the first 500 active faculty choices are shown. Use the faculty roster filters to find other colleagues.
      </p>:null}
    </Dialog>
    <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!pending)setConfirmOpen(next);}}
      title="Reassign upcoming class schedules?"
      description={sourceName+" → "+(target?.displayName??"faculty")+
        ". Only upcoming scheduled sessions without a target timetable conflict will be moved; audit history stays preserved."}
      confirmLabel="Reassign class schedules" confirmVariant="primary" pending={pending}
      confirmDisabled={!target}
      onConfirm={submit}/>
  </div>;
}
