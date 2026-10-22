"use client";

import {useEffect,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";

type StaffingRow={
 courseId:string;courseName:string;totalClasses:number;
 unstaffedClassCount:number;unstaffedClasses:string[];
 fullyUnstaffed:boolean;historicalUnstaffedClasses:string[];
};
type StaffingResponse={
 data:StaffingRow[];totalClasses:number;historicalClassCount:number;
 source:"PROGRAM_CLASSES_WITH_ACTIVE_COURSE_TEACHING_ASSIGNMENTS";
};
type ReadState={termId:string;status:"ready";result:StaffingResponse}|
 {termId:string;status:"error"};

export function CollegeTermStaffingReport({termId}:{termId:string}){
 const [state,setState]=useState<ReadState|null>(null);
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  if(!termId)return;
  const controller=new AbortController();
  void apiFetch<StaffingResponse>(
   "/api/academics/semesters/"+encodeURIComponent(termId)+"/staffing",
   {cache:"no-store",signal:controller.signal},
  ).then(result=>{
   if(!controller.signal.aborted)setState({termId,status:"ready",result});
  }).catch(()=>{
   if(!controller.signal.aborted)setState({termId,status:"error"});
  });
  return ()=>controller.abort();
 },[termId,retry]);
 if(!termId)return null;
 const loading=state?.termId!==termId||!state;
 const result=state?.status==="ready"&&state.termId===termId?state.result:null;
 return <section aria-label="Semester staffing gaps" className="min-w-0 space-y-3 border-t border-border pt-4">
  <h3 className="text-base font-semibold text-foreground">Faculty staffing by class</h3>
  <p className="text-sm text-body">Mapped courses are checked against every class in the program, even when no delivery has been created. Current active-delivery warnings above remain a separate measure.</p>
  {loading?<p role="status" className="text-sm text-body">Checking faculty assignments for program classes…</p>:null}
  {!loading&&state?.status==="error"?<div role="alert" className="space-y-2 text-sm text-error">
   <p>Class-by-class faculty staffing could not be loaded. No mappings were changed.</p>
   <Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={()=>{setState(null);setRetry(value=>value+1);}}>Retry staffing report</Button>
  </div>:null}
  {result?<div className="min-w-0 space-y-3">
   <p role="status" className="text-xs text-muted-foreground">{result.totalClasses} program classes checked{result.historicalClassCount?
    ` · ${result.historicalClassCount} historical/inactive`:""}. This report includes classes without live offerings.</p>
   {result.data.length===0?<p className="text-sm text-body">No courses mapped to this semester.</p>:
    <div tabIndex={0} role="region" aria-label="Faculty staffing report table, scroll for columns" className="min-w-0 overflow-x-auto border-y border-border">
     <table className="min-w-[580px] w-full border-collapse text-sm">
      <thead><tr className="border-b border-border text-left">
       <th scope="col" className="px-3 py-3">Course</th>
       <th scope="col" className="px-3 py-3">Total classes</th>
       <th scope="col" className="px-3 py-3">Unstaffed classes</th>
      </tr></thead>
      <tbody>{result.data.map(row=><tr key={row.courseId} className="border-b border-border align-top">
       <th scope="row" className="px-3 py-3 text-left font-semibold">{row.courseName}</th>
       <td className="px-3 py-3">{row.totalClasses}</td>
       <td className="px-3 py-3">
        <span className={row.unstaffedClassCount?"font-semibold text-warning":"text-body"}>
         {row.unstaffedClassCount} unstaffed{row.fullyUnstaffed?" · No faculty assigned":""}
        </span>
        {row.unstaffedClasses.length?<ul className="mt-1 list-inside list-disc text-body">
         {row.unstaffedClasses.map((name,index)=><li key={index}>{name}{row.historicalUnstaffedClasses.includes(name)?" (historical/inactive)":""}</li>)}
        </ul>:null}
       </td>
      </tr>)}</tbody>
     </table>
    </div>}
  </div>:null}
 </section>;
}
