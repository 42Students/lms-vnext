"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {StatusBadge} from "@/components/ui/status-badge";
import {isProjectMentorOverloaded} from "@/modules/projects/mentor-overload-model";

type WorkloadRow={
 mentorMembershipId:string|null;mentorName:string|null;
 activeWorkspaces:number;atRisk:number;
};
type SortKey="mentor"|"active"|"risk";
export function ProjectMentorWorkloadTable({
 rows,basePath,selectedMentorId,
}:{
 rows:readonly WorkloadRow[];basePath:string;selectedMentorId?:string;
}){
 const [sort,setSort]=useState<SortKey>("active");
 const [ascending,setAscending]=useState(false);
 const [page,setPage]=useState(1);
 const counts=rows.filter(row=>row.mentorMembershipId!==null)
   .map(row=>row.activeWorkspaces);
 const sorted=useMemo(()=>[...rows].sort((a,b)=>{
   const by=sort==="mentor"?
     (a.mentorName??"Unassigned").localeCompare(b.mentorName??"Unassigned","en-IN"):
     sort==="risk"?a.atRisk-b.atRisk:a.activeWorkspaces-b.activeWorkspaces;
   return (ascending?by:-by)||
     (a.mentorName??"").localeCompare(b.mentorName??"","en-IN");
 }),[rows,sort,ascending]);
 const pageCount=Math.max(1,Math.ceil(sorted.length/10));
 const currentPage=Math.min(page,pageCount);
 function chooseSort(key:SortKey){
   if(sort===key)setAscending(value=>!value);
   else{setSort(key);setAscending(key==="mentor");}
   setPage(1);
 }
 const cellLink=(row:WorkloadRow)=>{
   const id=row.mentorMembershipId??"UNASSIGNED";
   return basePath+"/reassign-mentor?fromMentorId="+encodeURIComponent(id);
 };
 return <div className="min-w-0 space-y-3">
  <p className="text-xs text-body">
   Select a mentor to filter eligible workspaces. Counts reflect the active college workload,
   while archived workspaces remain outside the reassignment queue.
  </p>
  <div className="min-w-0 overflow-x-auto border-y border-border">
   <table className="w-full min-w-[520px] border-collapse text-left text-sm">
    <caption className="sr-only">Mentor workload · 10 mentors per page</caption>
    <thead><tr className="border-b border-border bg-muted/20">
     {([
      ["mentor","Mentor"],["active","Active workspaces"],["risk","At-risk"],
     ] as const).map(([key,label])=><th key={key} scope="col"
      aria-sort={sort===key?(ascending?"ascending":"descending"):"none"}
      className="px-3 py-2 font-semibold">
       <button type="button" onClick={()=>chooseSort(key)}
        className="inline-flex min-h-9 items-center gap-1 text-left font-semibold underline-offset-2 hover:underline">
        {label}{key==="active"?<span title="Flagged when a mentor's active workspace count is 50% or more above the college average."
          aria-label="Counts above the overload threshold are flagged">?</span>:null}
       </button>
      </th>)}
    </tr></thead>
    <tbody>
     {sorted.slice((currentPage-1)*10,currentPage*10).map(row=><tr
       key={row.mentorMembershipId??"UNASSIGNED"}
       className="border-b border-border last:border-b-0">
       <td className="px-3 py-2">
        <Link href={cellLink(row)} aria-current={
           (selectedMentorId??"") ===(row.mentorMembershipId??"UNASSIGNED")?"page":undefined}
         className="inline-flex min-h-9 items-center font-semibold text-link underline">
         {row.mentorName??"Unassigned"}
        </Link>
       </td>
       <td className="px-3 py-2 tabular-nums">
        {row.activeWorkspaces}
        {row.mentorMembershipId&&isProjectMentorOverloaded(row.activeWorkspaces,counts)?
         <span className="ml-2"><StatusBadge tone="warning">Overloaded</StatusBadge></span>:null}
       </td>
       <td className="px-3 py-2 tabular-nums">
        {row.atRisk>0?<StatusBadge tone="warning">{row.atRisk} at risk</StatusBadge>:row.atRisk}
       </td>
      </tr>)}
    </tbody>
   </table>
  </div>
  {!sorted.length?<p className="text-sm text-body">
   No project workspaces available for this college.
  </p>:null}
  {pageCount>1?<nav aria-label="Mentor workload pages"
    className="flex flex-wrap items-center gap-2 text-sm">
    <span>Page {currentPage} of {pageCount}</span>
    <Button type="button" size="sm" variant="secondary"
     disabled={currentPage===1} onClick={()=>setPage(n=>Math.max(1,n-1))}>Previous</Button>
    <Button type="button" size="sm" variant="secondary"
     disabled={currentPage===pageCount}
     onClick={()=>setPage(n=>Math.min(pageCount,n+1))}>Next</Button>
   </nav>:null}
 </div>;
}
