"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {EmptyState} from "@/components/ui/empty-state";
import {StatusBadge} from "@/components/ui/status-badge";

export type TaskSubmissionOverviewRow={
 id:string;taskTitle:string;submitter:string;version:number;
 status:string;submittedAt:string;reviewedAt:string|null;submissionUrl:string|null;
};
/** Separate administrative submission list, independent of the editable task
 * plan. The old LMS paginated this table by ten rows, not by sprint.
 */
export function ProjectTaskSubmissionOverview({rows,metrics}:{
 rows:readonly TaskSubmissionOverviewRow[];
 metrics:readonly {label:string;value:string}[];
}){
 const [page,setPage]=useState(1);
 const size=10;
 const totalPages=Math.max(1,Math.ceil(rows.length/size));
 const currentPage=Math.min(page,totalPages);
 const first=(currentPage-1)*size;
 const visible=rows.slice(first,first+size);
 const format=(iso:string|null)=>{
  if(!iso)return "—";
  const d=new Date(iso);
  return Number.isFinite(d.getTime())?
   new Intl.DateTimeFormat("en-IN",{
     timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
   }).format(d):"—";
 };
 return <section aria-label="Task submissions summary"
   className="space-y-4 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-4">
   <header className="space-y-1">
    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-body">Task submissions</p>
    <h3 className="text-base font-semibold text-foreground">Submission overview</h3>
    <p className="text-sm text-body">Review recorded task evidence separately from the editable task plan.</p>
   </header>
   <dl className="grid min-w-0 grid-cols-2 border-t border-border sm:grid-cols-4">
    {metrics.map(metric=><div key={metric.label} className="border-b border-border px-2 py-3">
      <dt className="text-xs text-body">{metric.label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums">{metric.value}</dd>
    </div>)}
   </dl>
   {rows.length===0?<EmptyState title="No task submissions"
      description="No tasks have a submission link yet."/>:
    <div className="max-w-full overflow-x-auto">
     <table className="w-full min-w-[660px] border-collapse text-left text-sm">
      <caption className="sr-only">Recorded task submissions, ten per page</caption>
      <thead><tr className="border-b border-border text-xs font-semibold text-body">
       <th scope="col" className="px-2 py-2">Task</th>
       <th scope="col" className="px-2 py-2">Submitted by</th>
       <th scope="col" className="px-2 py-2">Status</th>
       <th scope="col" className="px-2 py-2">Submitted at</th>
       <th scope="col" className="px-2 py-2">Evidence</th>
      </tr></thead>
      <tbody>{visible.map(item=><tr key={item.id} className="border-b border-border align-top">
       <td className="px-2 py-3 font-semibold">{item.taskTitle}
         <span className="ml-1 text-xs font-normal text-body">v{item.version}</span></td>
       <td className="px-2 py-3">{item.submitter}</td>
       <td className="px-2 py-3"><StatusBadge tone={
         item.status==="APPROVED"?"success":
           item.status==="CHANGES_REQUESTED"?"warning":"info"}>
         {item.status.toLowerCase().replaceAll("_"," ")}</StatusBadge></td>
       <td className="px-2 py-3 tabular-nums">{format(item.submittedAt)}</td>
       <td className="px-2 py-3">{item.submissionUrl?
        <a href={item.submissionUrl} target="_blank" rel="noopener noreferrer"
         className="inline-flex min-h-9 items-center font-semibold text-link underline">
         Open submitted link <span className="sr-only">(opens in new tab)</span></a>:
        <span className="text-body">Unavailable link</span>}</td>
      </tr>)}</tbody>
     </table>
    </div>}
   <nav aria-label="Submission pages" className="flex flex-wrap items-center justify-between gap-3 text-xs text-body">
    <p role="status">Showing {rows.length?first+1:0}–{Math.min(first+size,rows.length)}
      {" of "}{rows.length} task submission{rows.length===1?"":"s"}</p>
    {totalPages>1?<div className="flex gap-2">
      <Button type="button" variant="secondary" size="sm" disabled={currentPage<=1}
        onClick={()=>setPage(n=>Math.max(1,n-1))}>Previous</Button>
      <span className="self-center tabular-nums">Page {currentPage} of {totalPages}</span>
      <Button type="button" variant="secondary" size="sm" disabled={currentPage>=totalPages}
        onClick={()=>setPage(n=>Math.min(totalPages,n+1))}>Next</Button>
    </div>:null}
   </nav>
  </section>;
}
