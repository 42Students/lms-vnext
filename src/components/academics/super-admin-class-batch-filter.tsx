"use client";
import {useState} from "react";
import {Select} from "@/components/ui/select";
type Program={id:string;name:string};
type Cohort={id:string;name:string;code:string;programId:string};
/** Legacy dependent Program → Batch selectors. No unscoped batch IDs may
 * survive a program change or be submitted through the class list form. */
export function SuperAdminClassBatchFilter({programs,cohorts,
 selectedProgramId,selectedCohortCode}:{
 programs:readonly Program[];cohorts:readonly Cohort[];
 selectedProgramId:string;selectedCohortCode:string;
}){
 const [programId,setProgramId]=useState(selectedProgramId);
 const [cohortCode,setCohortCode]=useState(selectedCohortCode);
 const visible=cohorts.filter(item=>item.programId===programId);
 const resolved=visible.some(item=>item.code===cohortCode)?cohortCode:"";
 return <div className="grid min-w-0 gap-3 md:col-span-2 md:grid-cols-2 xl:col-span-2">
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">Program
   <Select name="programId" value={programId} onChange={event=>{
    setProgramId(event.target.value);setCohortCode("");
   }} className="min-h-11 w-full md:min-h-9">
    <option value="">Program</option>
    {programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
   </Select>
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">Batch
   <Select name="cohortCode" disabled={!programId} value={resolved}
    onChange={event=>setCohortCode(event.target.value)}
    className="min-h-11 w-full md:min-h-9">
    <option value="">{programId?"All batches":"Select a program first"}</option>
    {visible.map(p=><option key={p.id} value={p.code}>{p.name} ({p.code})</option>)}
   </Select>
  </label>
 </div>;
}
