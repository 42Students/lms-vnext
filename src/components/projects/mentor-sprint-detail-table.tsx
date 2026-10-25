"use client";
import Link from "next/link";
import {useState} from "react";

export type MentorSprintDetailRow={
  id:string;sequence:number;title:string;release:string;
  status:string;startDate:string|null;endDate:string|null;
  taskCount:number;plannedPoints:number|null;donePoints:number|null;carriedCount:number;
};

/** Preserve the prototype's per-sprint operational rows alongside vNext charts.
 * Missing historical snapshots remain unavailable, never fabricated as zero. */
export function MentorSprintDetailTable({projectId,rows}:{
  projectId:string;rows:readonly MentorSprintDetailRow[];
}){
  const [status,setStatus]=useState("ALL");
  const [release,setRelease]=useState("ALL");
  const releases=[...new Set(rows.map(row=>row.release))];
  const matching=rows.filter(row=>(status==="ALL"||row.status===status)&&
    (release==="ALL"||row.release===release));
  const base="/mentor/projects/"+encodeURIComponent(projectId);
  return <section className="prototype-mentor-chart-card" aria-label="Detailed sprint plan">
    <div className="prototype-mentor-card-title">
      <h2>All sprints · detailed plan</h2>
      <span>{matching.length} of {rows.length} recorded sprints</span>
    </div>
    <div className="mb-3 flex flex-wrap gap-3">
      <label className="text-sm font-semibold">State
        <select aria-label="Filter sprint state" value={status}
          onChange={event=>setStatus(event.target.value)}
          className="ml-2 min-h-11 rounded border border-border bg-surface px-2">
          {["ALL","ACTIVE","PLANNED","COMPLETED"].map(value=>
            <option key={value} value={value}>{value==="ALL"?"All states":
              value.replaceAll("_"," ").toLowerCase()}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold">Release
        <select aria-label="Filter sprint release" value={release}
          onChange={event=>setRelease(event.target.value)}
          className="ml-2 min-h-11 rounded border border-border bg-surface px-2">
          <option value="ALL">All releases</option>
          {releases.map(value=><option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      {(status!=="ALL"||release!=="ALL")?<button type="button"
        className="min-h-11 text-sm font-semibold text-link underline"
        onClick={()=>{setStatus("ALL");setRelease("ALL");}}>Clear filters</button>:null}
    </div>
    {!matching.length?<p role="status">No sprints match these filters.</p>:
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-[730px] border-collapse text-left text-sm">
          <caption className="sr-only">Recorded release and sprint detail, state and points</caption>
          <thead><tr className="border-b border-border">
            <th scope="col" className="p-2">Sprint</th>
            <th scope="col" className="p-2">Dates</th>
            <th scope="col" className="p-2">State</th>
            <th scope="col" className="p-2">Tasks</th>
            <th scope="col" className="p-2">Planned</th>
            <th scope="col" className="p-2">Done</th>
            <th scope="col" className="p-2">Carried</th>
            <th scope="col" className="p-2">Open</th>
          </tr></thead>
          <tbody>{matching.map(row=><tr key={row.id} className="border-b border-border">
            <td className="p-2"><strong>Sprint {row.sequence} · {row.title}</strong>
              <small className="block text-muted-foreground">{row.release}</small></td>
            <td className="p-2">{row.startDate??"Not set"} – {row.endDate??"Not set"}</td>
            <td className="p-2">{row.status.replaceAll("_"," ").toLowerCase()}</td>
            <td className="p-2 tabular-nums">{row.taskCount}</td>
            <td className="p-2 tabular-nums">{row.plannedPoints??"Not recorded"}</td>
            <td className="p-2 tabular-nums">{row.donePoints??"Not recorded"}</td>
            <td className="p-2 tabular-nums">{row.carriedCount}</td>
            <td className="p-2"><Link className="font-semibold text-link underline"
              href={base+"?tab=board&sprint="+encodeURIComponent(row.id)}>
              View tasks</Link></td>
          </tr>)}</tbody>
        </table>
      </div>}
    <p className="mt-2 text-xs text-muted-foreground">
      Completed-sprint points use saved sign-off snapshots. Unrecorded historical
      points are labelled unavailable, never replaced by live task totals.
    </p>
  </section>;
}
