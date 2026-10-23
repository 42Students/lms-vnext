"use client";
import {useMemo,useState} from "react";

type Student={id:string;name:string;label:string};
type Task={id:string;assigneeMembershipId:string|null;sprintId:string|null;
  status:string;estimatePoints:number|null;carriedFromSprintId:string|null};
type Sprint={id:string;sequence:number;title:string;status:string};

const pts=(tasks:readonly Task[])=>tasks.reduce((sum,task)=>sum+(task.estimatePoints??0),0);
export function MentorPrototypePerformanceTable({
  students,tasks,sprints,
}:{students:readonly Student[];tasks:readonly Task[];sprints:readonly Sprint[]}){
  const [range,setRange]=useState("all");
  const sorted=useMemo(()=>[...sprints].sort((a,b)=>a.sequence-b.sequence),[sprints]);
  const active=sorted.find(item=>item.status==="ACTIVE");
  const lastFour=new Set(sorted.slice(-4).map(item=>item.id));
  const visible=tasks.filter(task=>range==="all"||
    range==="current"?range==="all"||task.sprintId===active?.id:
    range==="last4"?Boolean(task.sprintId&&lastFour.has(task.sprintId)):
    task.sprintId===range);
  const unassigned=visible.filter(task=>task.assigneeMembershipId===null&&
    !["DONE","IN_REVIEW"].includes(task.status));
  const studentRows=students.map(student=>{
    const assigned=visible.filter(task=>task.assigneeMembershipId===student.id);
    const done=assigned.filter(task=>task.status==="DONE");
    const review=assigned.filter(task=>task.status==="IN_REVIEW");
    const open=assigned.filter(task=>!["DONE","IN_REVIEW"].includes(task.status));
    const carried=assigned.filter(task=>task.carriedFromSprintId!==null);
    return {student,assigned,done,review,open,carried};
  });
  return <div className="prototype-mentor-performance">
    <section className="prototype-mentor-chart-card">
      <div className="prototype-mentor-card-title prototype-mentor-performance-filter-bar">
        <h2>Who did what</h2>
        <label>In
          <select value={range} onChange={event=>setRange(event.target.value)}>
            <option value="all">All recorded sprints</option>
            <option value="current">Current sprint</option>
            <option value="last4">Last four sprints</option>
            {sorted.map(sprint=><option key={sprint.id} value={sprint.id}>
              Sprint {sprint.sequence} · {sprint.title}
            </option>)}
          </select>
        </label>
      </div>
      <p className="prototype-mentor-performance-intro">
        From the board: done, waiting for you, still open and carried over.
        Points use the project's recorded estimates.
      </p>
      <div className="prototype-mentor-performance-table">
        <div className="prototype-mentor-performance-head" aria-hidden="true">
          <span>Student</span><span>Done</span><span>Waiting</span><span>Open</span><span>Carried</span><span>Points done</span>
        </div>
        {studentRows.map(row=><div key={row.student.id}
          className="prototype-mentor-performance-row">
          <strong>{row.student.name}<small>{row.student.label}</small></strong>
          <span>{row.done.length}</span><span>{row.review.length}</span>
          <span>{row.open.length}</span><span>{row.carried.length}</span>
          <span>{pts(row.done)} pts</span>
        </div>)}
        {!studentRows.length?<p className="prototype-mentor-summary-empty">
          No students are assigned to this project.
        </p>:null}
        {studentRows.length>0&&visible.length===0?<p className="prototype-mentor-summary-empty">
          No recorded work in this sprint range.
        </p>:null}
      </div>
    </section>
    <section className="prototype-mentor-backlog-card">
      <div className="prototype-mentor-card-title">
        <h2>Unassigned work · {unassigned.length} tasks</h2>
        <span>{pts(unassigned)} estimated points</span>
      </div>
      <p>Use the assignment controls below to allocate these tasks.
        Automatic assignment still requires confirmation.</p>
    </section>
  </div>;
}
