"use client";
import {useMemo,useState} from "react";
import type {MentorSprintMemberSnapshot,MentorSprintSignOffSnapshot}
  from "@/modules/projects/mentor-sprint-signoff-snapshot-model";
import {recentMentorWorkedSprintIds} from
  "@/modules/projects/mentor-recent-worked-sprints-model";
import {mentorMemberSprintHistory,deriveMentorPerformanceInsights} from
  "@/modules/projects/mentor-performance-insights-model";
import {mentorPointStack} from "@/modules/projects/mentor-point-stack-model";
import {orderMentorSprints} from "@/modules/projects/mentor-sprint-order-model";
import {mentorSprintPointSparkline} from "@/modules/projects/mentor-member-points-sparkline-model";

type Student={id:string;name:string;label:string};
type Task={id:string;assigneeMembershipId:string|null;sprintId:string|null;
  status:string;estimatePoints:number|null;carriedFromSprintId:string|null};
type Sprint={id:string;sequence:number;title:string;status:string;releaseId:string};
type Release={id:string;title:string;sequence:number};

const pts=(tasks:readonly Task[])=>tasks.reduce((sum,task)=>sum+(task.estimatePoints??0),0);
const sum=(rows:readonly MentorSprintMemberSnapshot[],key:keyof Pick<
  MentorSprintMemberSnapshot,"doneCount"|"waitingCount"|"openCount"|"carriedCount"|
    "donePoints"|"openPoints"|"plannedPoints">)=>rows.reduce((total,row)=>total+row[key],0);

/** Completed sprint workload must come from recorded sign-off history, not
 * current task.sprintId/assignee, which changes on carry-over or reassignment.
 */
export function MentorPrototypePerformanceTable({
  students,tasks,sprints,releases,snapshots,
}:{students:readonly Student[];tasks:readonly Task[];sprints:readonly Sprint[];
  releases:readonly Release[];snapshots:readonly MentorSprintSignOffSnapshot[]}){
  const [range,setRange]=useState("all");
  const sorted=useMemo(()=>orderMentorSprints(sprints,releases),[sprints,releases]);
  const active=sorted.find(item=>item.status==="ACTIVE");
  const lastFour=new Set(recentMentorWorkedSprintIds(sorted,releases));
  const chosen=sorted.find(item=>item.id===range);
  const releaseId=range.startsWith("release:")?range.slice("release:".length):null;
  const included=range==="whole"?sorted
    :range==="last4"?sorted.filter(item=>lastFour.has(item.id))
    :releaseId?sorted.filter(item=>item.releaseId===releaseId)
    :chosen?[chosen]:range==="current"?sorted.filter(item=>item.id===active?.id):[];
  const historyMode=range==="whole"||range==="last4"||Boolean(releaseId)||
    chosen?.status==="COMPLETED";
  const historicalSprints=included.filter(item=>item.status==="COMPLETED");
  const liveSprintIds=new Set(included.filter(item=>item.status!=="COMPLETED")
    .map(item=>item.id));
  const snapshotMap=new Map(snapshots.map(snapshot=>[snapshot.sprintId,snapshot] as const));
  const saved=historicalSprints.flatMap(item=>{
    const snapshot=snapshotMap.get(item.id);
    return snapshot?[snapshot]:[];
  });
  const missingHistory=historicalSprints.filter(item=>!snapshotMap.has(item.id));
  const liveTasks=tasks.filter(task=>{
    if(range==="all")return true;
    if(range==="whole")return task.sprintId===null||Boolean(
      task.sprintId&&liveSprintIds.has(task.sprintId));
    if(range==="current")return task.sprintId===active?.id;
    if(range==="last4"||releaseId||chosen)return Boolean(task.sprintId&&
      liveSprintIds.has(task.sprintId));
    return false;
  });
  const historicalRows=saved.flatMap(snapshot=>snapshot.memberRows);
  const unassigned=liveTasks.filter(task=>task.assigneeMembershipId===null&&
    !["DONE","IN_REVIEW"].includes(task.status));
  const unassignedPast=historicalRows.filter(row=>row.membershipId===null);
  const unassignedCount=unassigned.length+sum(unassignedPast,"openCount");
  const unassignedPoints=pts(unassigned)+sum(unassignedPast,"openPoints");
  const currentOpen=tasks.filter(task=>!["DONE","IN_REVIEW"].includes(task.status));
  const studentRows=students.map(student=>{
    const assigned=liveTasks.filter(task=>task.assigneeMembershipId===student.id);
    const done=assigned.filter(task=>task.status==="DONE");
    const review=assigned.filter(task=>task.status==="IN_REVIEW");
    const open=assigned.filter(task=>!["DONE","IN_REVIEW"].includes(task.status));
    const carried=assigned.filter(task=>task.carriedFromSprintId!==null);
    const previous=historicalRows.filter(row=>row.membershipId===student.id);
    const trend=mentorMemberSprintHistory(student.id,sorted,snapshots,releases);
    const sparkline=mentorSprintPointSparkline(trend);
    const insights=deriveMentorPerformanceInsights({points:trend,
      currentOpenCount:currentOpen.filter(task=>task.assigneeMembershipId===student.id).length,
      totalProjectOpen:currentOpen.length});
    const stack=mentorPointStack(pts(done)+sum(previous,"donePoints"),
      pts(review)+sum(previous,"plannedPoints")-
        sum(previous,"donePoints")-sum(previous,"openPoints"),
      pts(open)+sum(previous,"openPoints"));
    return {student,trend,sparkline,insights,stack,done:done.length+sum(previous,"doneCount"),
      review:review.length+sum(previous,"waitingCount"),
      open:open.length+sum(previous,"openCount"),
      carried:carried.length+sum(previous,"carriedCount"),
      donePoints:pts(done)+sum(previous,"donePoints"),
      waitingPoints:pts(review)+sum(previous,"plannedPoints")-
        sum(previous,"donePoints")-sum(previous,"openPoints"),
      openPoints:pts(open)+sum(previous,"openPoints")};
  });
  return <div className="prototype-mentor-performance">
    <section className="prototype-mentor-chart-card">
      <div className="prototype-mentor-card-title prototype-mentor-performance-filter-bar">
        <h2>Who did what</h2>
        <label>In
          <select value={range} onChange={event=>setRange(event.target.value)}>
            <option value="all">All (current task records)</option>
            <option value="whole">Whole project (sign-off history + current)</option>
            <option value="current">Current sprint</option>
            <option value="last4">Last four worked sprints</option>
            {releases.map(release=><option key={release.id} value={"release:"+release.id}>
              {release.title}
            </option>)}
            {sorted.map(sprint=><option key={sprint.id} value={sprint.id}>
              Sprint {sprint.sequence} · {sprint.title}
            </option>)}
          </select>
        </label>
      </div>
      <p className="prototype-mentor-performance-intro">
        {historyMode?"Completed sprint results use immutable sign-off records; current sprint results use live tasks.":
          "Live task state, ownership and recorded estimate points."}
        {" "}Done, waiting for review, open and carried-over work.
      </p>
      {missingHistory.length>0?<p role="status">
        Historical workload was not captured for {missingHistory.length}
        {" "}{missingHistory.length===1?"completed sprint":"completed sprints"}.
        Their figures are unavailable and are not counted as zero.
      </p>:null}
      <div className="prototype-mentor-performance-table">
        <div className="prototype-mentor-performance-head" aria-hidden="true">
          <span>Student</span><span>Done</span><span>Waiting</span><span>Open</span><span>Carried</span><span>Points done</span>
        </div>
        {studentRows.map(row=><div key={row.student.id}
          id={"mentor-student-"+row.student.id}
          className="prototype-mentor-performance-row">
          <strong>{row.student.name}<small>{row.student.label}</small>
            {row.sparkline.length?<span className="mt-2 block"
              aria-label={row.student.name+" last "+row.sparkline.length+
                " recorded sprint point results"}>
              <span className="flex h-12 items-end gap-2"
                role="img" aria-label={row.sparkline.map(item=>
                  "Sprint "+item.sequence+": "+item.donePoints+
                  " of "+item.plannedPoints+" points earned").join("; ")}>
                {row.sparkline.map(item=><span key={item.sprintId}
                  className="relative block h-11 w-4 shrink-0 rounded-t-sm bg-muted"
                  title={"Sprint "+item.sequence+": "+item.donePoints+
                    " of "+item.plannedPoints+" points earned"}>
                  <span className="absolute bottom-0 left-0 right-0 bg-info/30"
                    style={{height:item.plannedHeightPct+"%"}}/>
                  <span className="absolute bottom-0 left-0 right-0 bg-success"
                    style={{height:item.doneHeightPct+"%"}}/>
                </span>)}
              </span>
              <small className="block">
                {row.sparkline.map(item=>"S"+item.sequence+": "+item.donePoints+
                  "/"+item.plannedPoints).join(" · ")} pts
              </small>
            </span>:<small>No signed-off sprint points recorded</small>}
          </strong>
          <span>{row.done}<small>{row.donePoints} pts</small></span>
          <span>{row.review}<small>{row.waitingPoints} pts</small></span>
          <span>{row.open}<small>{row.openPoints} pts</small></span>
          <span>{row.carried}</span>
          <span>{row.donePoints} pts</span>
          <div className="col-span-full flex flex-col gap-1"
            aria-label={row.student.name+" points: "+
              row.stack.done+" done, "+row.stack.waiting+" waiting, "+
              row.stack.open+" open; total "+row.stack.total}>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
              role="img" aria-label={row.student.name+" proportional work in points"}>
              <span className="bg-success" style={{width:row.stack.donePct+"%"}}
                title={row.stack.done+" completed points"}/>
              <span className="bg-warning" style={{width:row.stack.waitingPct+"%"}}
                title={row.stack.waiting+" waiting points"}/>
              <span className="bg-info" style={{width:row.stack.openPct+"%"}}
                title={row.stack.open+" open points"}/>
            </div>
            <small>{row.stack.done} done · {row.stack.waiting} waiting ·
              {" "}{row.stack.open} open · {row.stack.total} planned points in selected range</small>
          </div>
        </div>)}
        {!studentRows.length?<p className="prototype-mentor-summary-empty">
          No students are assigned to this project.
        </p>:null}
        {studentRows.length>0&&liveTasks.length===0&&saved.length===0?
          <p className="prototype-mentor-summary-empty">
            No recorded work in this sprint range.
          </p>:null}
      </div>
      {studentRows.some(row=>row.insights.length>0)?<div
        className="prototype-mentor-performance-intro" aria-label="Worth a look">
        <h3>Worth a look · recorded workload signals</h3>
        <ul>{studentRows.flatMap(row=>row.insights.map(signal=>
          <li key={row.student.id+":"+signal.code}>
            <strong>{row.student.name}</strong>: {signal.description}
          </li>))}</ul>
        <p>These are factual workload prompts, not individual performance ratings
          or predictions about students.</p>
      </div>:null}
    </section>
    <section className="prototype-mentor-backlog-card">
      <div className="prototype-mentor-card-title">
        <h2>Unassigned work · {unassignedCount} tasks</h2>
        <span>{unassignedPoints} estimated points</span>
      </div>
      <p>Use the assignment controls below to allocate current unassigned tasks.
        Historical sprint counts are read-only and never reassigned retroactively.</p>
    </section>
  </div>;
}
