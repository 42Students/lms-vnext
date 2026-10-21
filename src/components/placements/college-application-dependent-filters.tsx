"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";

type Department = {id:string;name:string};
type Program = {id:string;name:string;departmentId:string};
type Cohort = {id:string;name:string;programId:string};

/** Native form fields with legacy parent-to-child reset; submitted values are always
 * canonical UUIDs and server validation still provides the permission boundary.
 */
export function CollegeApplicationDependentFilters({
  initial, departments, programs, cohorts,
}: {
  initial:{departmentId?:string;programId?:string;cohortId?:string};
  departments:Department[];programs:Program[];cohorts:Cohort[];
}) {
  const [departmentId,setDepartmentId]=useState(initial.departmentId??"");
  const [programId,setProgramId]=useState(initial.programId??"");
  const [cohortId,setCohortId]=useState(initial.cohortId??"");
  const availablePrograms=programs.filter(program=>!departmentId||program.departmentId===departmentId);
  const allowedProgramIds=new Set(availablePrograms.map(program=>program.id));
  const availableCohorts=cohorts.filter(cohort=>
    programId ? cohort.programId===programId :
    !departmentId || allowedProgramIds.has(cohort.programId));
  return <>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Department
      <Select name="departmentId" value={departmentId} onChange={event=>{
        setDepartmentId(event.target.value);setProgramId("");setCohortId("");
      }}>
        <option value="">All departments</option>
        {departmentId&&!departments.some(item=>item.id===departmentId)?
          <option value={departmentId}>Selected department (not in current options)</option>:null}
        {departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
      </Select>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
      <Select name="programId" value={programId} onChange={event=>{
        setProgramId(event.target.value);setCohortId("");
      }}>
        <option value="">All programs</option>
        {programId&&!availablePrograms.some(item=>item.id===programId)?
          <option value={programId}>Selected program (not in current options)</option>:null}
        {availablePrograms.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
      </Select>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch
      <Select name="cohortId" value={cohortId} onChange={event=>setCohortId(event.target.value)}>
        <option value="">All batches</option>
        {cohortId&&!availableCohorts.some(item=>item.id===cohortId)?
          <option value={cohortId}>Selected batch (not in current options)</option>:null}
        {availableCohorts.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
      </Select>
    </label>
  </>;
}
