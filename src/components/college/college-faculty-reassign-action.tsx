"use client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {teachingReassignPrompt} from "@/modules/courses/college-teaching-reassign-model";

export function CollegeFacultyReassignAction({assignmentId,facultyName,role,oldMembershipId,
  expectedUpdatedAt,faculty}:{
  assignmentId:string;facultyName:string;role:"PRIMARY"|"CO_TEACHER"|"TA";
  oldMembershipId:string;expectedUpdatedAt:string;faculty:{id:string;label:string}[];
}) {
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [replacementMembershipId,setReplacementMembershipId]=useState("");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");
  const candidates=faculty.filter(f=>f.id!==oldMembershipId);
  async function submit(){
    const target=candidates.find(f=>f.id===replacementMembershipId);
    if(!target)return;
    setPending(true);setError("");
    try {
      const response=await fetch("/api/college/teaching-assignments/"+encodeURIComponent(assignmentId)+"/reassign",{
        method:"PATCH",headers:{"content-type":"application/json"},
        body:JSON.stringify({expectedMembershipId:oldMembershipId,replacementMembershipId,
          expectedUpdatedAt,confirm:true}),
      });
      if(!response.ok){
        const payload=await response.json().catch(()=>({error:"REASSIGNMENT_FAILED"})) as {error?:string};
        throw new Error(payload.error??"REASSIGNMENT_FAILED");
      }
      setOpen(false);setReplacementMembershipId("");router.refresh();
    }catch(reason){setError(reason instanceof Error?reason.message:"Reassignment failed.");}
    finally{setPending(false);}
  }
  return <div className="space-y-1">
    <Button variant="secondary" type="button" disabled={pending||candidates.length===0} onClick={()=>setOpen(true)}
      className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border px-3 text-xs font-semibold text-primary-text disabled:opacity-50">
      Reassign
    </Button>
    <Dialog open={open} onOpenChange={next=>{if(!next&&!pending)setOpen(false);}} title={"Reassign "+facultyName} dismissible={!pending}>
        <h2 className="text-lg font-semibold text-foreground">Reassign {role}</h2>
        <p className="text-sm text-body">Replace {facultyName}; existing teaching history will be retained.</p>
        <label className="grid gap-2 text-sm font-semibold text-body">Replacement Faculty
          <Select value={replacementMembershipId} onChange={e=>setReplacementMembershipId(e.target.value)}
            className="min-h-[var(--lms-control-height)] min-w-0 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-foreground">
            <option value="">Choose Faculty</option>
            {candidates.map(person=><option key={person.id} value={person.id}>{person.label}</option>)}
          </Select>
        </label>
        {replacementMembershipId?<p role="status" className="rounded-[var(--lms-control-radius,9px)] border border-border bg-muted p-3 text-sm">{teachingReassignPrompt(facultyName,candidates.find(person=>person.id===replacementMembershipId)?.label??"Faculty",role)}</p>:null}
        {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" type="button" disabled={pending} onClick={()=>setOpen(false)}
            className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border px-4 text-sm font-semibold text-primary-text">Cancel</Button>
          <Button variant="primary" type="button" disabled={pending||!replacementMembershipId} onClick={submit}
            className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] bg-primary px-4 text-sm font-semibold text-on-primary">
            {pending?"Reassigning…":"Confirm replacement"}
          </Button>
        </div>
    </Dialog>
    {!open&&error?<p role="alert" className="text-xs text-error">{error}</p>:null}
  </div>;
}
