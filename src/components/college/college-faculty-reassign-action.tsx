"use client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Alert} from "@/components/ui/alert";
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
      className="min-h-11 w-full sm:w-auto md:min-h-9">
      Reassign
    </Button>
    <Dialog open={open} onOpenChange={next=>{if(!next&&!pending)setOpen(false);}} title={"Reassign "+facultyName+" · "+role} dismissible={!pending} footer={<>
<Button variant="secondary" type="button" disabled={pending} onClick={()=>setOpen(false)}
            className="min-h-11 w-full sm:w-auto md:min-h-9">Cancel</Button>
          <Button variant="primary" type="button" disabled={pending||!replacementMembershipId} onClick={submit}
            className="min-h-11 w-full sm:w-auto md:min-h-9" loading={pending}>
            {pending?"Reassigning…":"Confirm replacement"}
          </Button>
</>}>
        <p className="text-sm text-body">Replace {facultyName}; existing teaching history will be retained.</p>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Replacement Faculty
          <Select value={replacementMembershipId} disabled={pending} onChange={e=>setReplacementMembershipId(e.target.value)}>
            <option value="">Choose Faculty</option>
            {candidates.map(person=><option key={person.id} value={person.id}>{person.label}</option>)}
          </Select>
        </label>
        {replacementMembershipId?<Alert tone="info">{teachingReassignPrompt(facultyName,candidates.find(person=>person.id===replacementMembershipId)?.label??"Faculty",role)}</Alert>:null}
        {error?<Alert tone="error">{error}</Alert>:null}
        
    </Dialog>
    {!open&&error?<Alert tone="error">{error}</Alert>:null}
  </div>;
}
