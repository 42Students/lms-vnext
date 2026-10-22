"use client";
import {useState} from "react";
import {Select} from "@/components/ui/select";

type Option={id:string;name:string};
type Program=Option&{departmentId?:string};
type Batch=Option&{programId?:string};
type Section=Option&{cohortId?:string};
type Initial={departmentId?:string;programId?:string;cohortId?:string;sectionId?:string};

/** Selected-college option lists come from the authorized server reader.
 * Changing a parent clears stale child filters before GET form submission,
 * matching the legacy Department -> Program -> Batch -> Class cascade. */
export function AdminPeopleAcademicCascade({departments,programs,batches,classes,initial}:{
 departments:readonly Option[];programs:readonly Program[];
 batches:readonly Batch[];classes:readonly Section[];initial:Initial;
}){
 const [department,setDepartment]=useState(initial.departmentId??"");
 const [program,setProgram]=useState(initial.programId??"");
 const [batch,setBatch]=useState(initial.cohortId??"");
 const [section,setSection]=useState(initial.sectionId??"");
 const availablePrograms=programs.filter(row=>!department||!row.departmentId||row.departmentId===department);
 const selectedProgram=availablePrograms.some(row=>row.id===program)?program:"";
 const availableBatches=batches.filter(row=>!selectedProgram||!row.programId||row.programId===selectedProgram);
 const selectedBatch=availableBatches.some(row=>row.id===batch)?batch:"";
 const availableClasses=classes.filter(row=>!selectedBatch||!row.cohortId||row.cohortId===selectedBatch);
 const selectedSection=availableClasses.some(row=>row.id===section)?section:"";
 const field="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]";
 return <>
  <label className={field}>Department
   <Select name="departmentId" className="w-full" value={department}
     onChange={e=>{setDepartment(e.target.value);setProgram("");setBatch("");setSection("");}}>
    <option value="">All departments</option>
    {departments.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
   </Select>
  </label>
  <label className={field}>Program
   <Select name="programId" className="w-full" value={selectedProgram}
     onChange={e=>{setProgram(e.target.value);setBatch("");setSection("");}}>
    <option value="">All programs</option>
    {availablePrograms.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
   </Select>
  </label>
  <label className={field}>Batch
   <Select name="cohortId" className="w-full" value={selectedBatch}
     onChange={e=>{setBatch(e.target.value);setSection("");}}>
    <option value="">All batches</option>
    {availableBatches.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
   </Select>
  </label>
  <label className={field}>Class
   <Select name="sectionId" className="w-full" value={selectedSection}
     onChange={e=>setSection(e.target.value)}>
    <option value="">All classes</option>
    {availableClasses.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
   </Select>
  </label>
 </>;
}
