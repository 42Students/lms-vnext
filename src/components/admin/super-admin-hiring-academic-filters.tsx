"use client";
import {useState} from "react";
import {Select} from "@/components/ui/select";

type Option={id:string;name:string};
export function SuperAdminHiringAcademicFilters({
 departments,programs,batches,selected,
}:{
 departments:readonly Option[];programs:readonly Option[];batches:readonly Option[];
 selected:{departmentId?:string;programId?:string;cohortId?:string};
}){
 const [departmentId,setDepartmentId]=useState(selected.departmentId??"");
 const [programId,setProgramId]=useState(selected.programId??"");
 const [cohortId,setCohortId]=useState(selected.cohortId??"");
 const items=[
  {key:"departmentId",label:"Department",options:departments,value:departmentId,
   change:(value:string)=>{setDepartmentId(value);setProgramId("");setCohortId("");}},
  {key:"programId",label:"Program",options:programs,value:programId,
   change:(value:string)=>{setProgramId(value);setCohortId("");}},
  {key:"cohortId",label:"Batch",options:batches,value:cohortId,
   change:(value:string)=>setCohortId(value)},
 ] as const;
 return <>{items.map(item=><label key={item.key}
  className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
  {item.label}
  <Select name={item.key} value={item.value} onChange={event=>item.change(event.target.value)}
   className="min-w-0">
   <option value="">All {item.label.toLowerCase()}s</option>
   {item.value&&!item.options.some(option=>option.id===item.value)?
    <option value={item.value}>Current selected {item.label.toLowerCase()}</option>:null}
   {item.options.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}
  </Select>
 </label>)}</>;
}
