"use client";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { Dialog } from "@/components/ui/dialog";
import Link from "next/link";
import { LearnerTaskStatusActions } from "./learner-task-status-actions";
import { ProjectTaskComments } from "./project-task-comments";
import { projectTaskVisibleFacts } from "@/modules/projects/project-task-visible-facts-model";
import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";
import { learnerBoardTaskWorkspaceHref } from "@/modules/projects/learner-board-task-workflow-model";
import { learnerBoardTaskStatusLabel, learnerBoardTaskPriorityLabel } from "@/modules/projects/learner-board-task-status-label-model";
import { learnerBoardTaskStatusTone, learnerBoardTaskPriorityTone } from "@/modules/projects/learner-board-task-attention-tone-model";
import { createLearnerBoardTaskDialogNavigationGuard } from "@/modules/projects/learner-board-task-dialog-navigation-model";
import { StatusBadge } from "@/components/ui/status-badge";
import { useRouter } from "next/navigation";
import type { LearnerTaskBoardUrlFilters } from "@/modules/projects/learner-board-task-detail-model";
import { learnerBoardTaskHref } from "@/modules/projects/learner-board-task-detail-model";

export function LearnerBoardTaskDetailDialog({
  projectId, filters, task, sprintTitle, currentMembershipId, assigneeName, commentCount=0, submissionUrl=null,
  activityEvents=[],
}: {
  projectId:string;
  filters:LearnerTaskBoardUrlFilters;
  task:{
    id:string;title:string;description:string|null;approach:string|null;acceptanceCriteria:string|null;
    status:string;priority:string;updatedAt:Date;assigneeMembershipId:string|null;blockerReason:string|null;
    dueDate:string|null;estimatePoints:number|null;taskType:string|null;
    carriedFromSprintId?:string|null;
  };
  currentMembershipId:string|null;
  sprintTitle:string|null;
  assigneeName:string|null;
  commentCount?:number;
  submissionUrl?:string|null;
  activityEvents?:readonly {summary:string;actorDisplayName:string|null;occurredAt:Date}[];
}) {
  const navigatingRef=useRef(createLearnerBoardTaskDialogNavigationGuard());
  const router=useRouter();
  const returnHref=learnerBoardTaskHref(projectId,filters);
  const facts=projectTaskVisibleFacts(task,assigneeName);
  useEffect(()=>{ navigatingRef.current.reset(); },[task.id]);
  return (
    <Dialog open={true} title={task.title} description="Project Board task" className="max-w-[38rem]"
      onOpenChange={next=>{if(!next&&navigatingRef.current.shouldReturn())router.replace(returnHref);}}>
      {task.carriedFromSprintId?<p className="mt-2 text-xs font-semibold text-warning-text">
        Carried over
      </p>:null}
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-muted-foreground">Status</dt><dd className="mt-1"><StatusBadge tone={learnerBoardTaskStatusTone(task.status)}>{learnerBoardTaskStatusLabel(task.status)}</StatusBadge></dd></div>
        <div><dt className="text-muted-foreground">Priority</dt><dd className="mt-1"><StatusBadge tone={learnerBoardTaskPriorityTone(task.priority)}>{learnerBoardTaskPriorityLabel(task.priority)}</StatusBadge></dd></div>
        <div className="col-span-2"><dt className="text-muted-foreground">Sprint</dt><dd className="mt-1 font-semibold">{sprintTitle??"Not assigned"}</dd></div>
        <div><dt className="text-muted-foreground">Assignee</dt><dd>{facts.assignee}</dd></div>
        <div><dt className="text-muted-foreground">Due date</dt><dd>{facts.dueDate}</dd></div>
        <div><dt className="text-muted-foreground">Estimate</dt><dd>{facts.estimate}</dd></div>
        <div><dt className="text-muted-foreground">Task type</dt><dd>{facts.taskType}</dd></div>
        {facts.blockerReason ? <div className="col-span-2">
          <dt className="text-muted-foreground">Blocker note</dt>
          <dd className="whitespace-pre-wrap break-words">{facts.blockerReason}</dd>
        </div> : null}
      </dl>
      <h3 className="mt-5 text-sm font-semibold">Submission</h3>
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-body">
        <span>{commentCount} comment{commentCount===1?"":"s"}</span>
        {safeProjectExternalHref(submissionUrl)?
          <a href={safeProjectExternalHref(submissionUrl)??undefined} target="_blank" rel="noopener noreferrer"
            className="text-primary-text underline">Submission link attached ↗</a>:null}
      </div>
      {task.approach?<section className="mt-5" aria-label="Task approach">
        <h3 className="font-semibold">Approach</h3>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-body">{task.approach}</p>
      </section>:null}
      <section className="mt-5">
        <h3 className="font-semibold">Details</h3>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-body">{task.description??"No task description provided."}</p>
      </section>
      <section className="mt-5">
        <h3 className="font-semibold">Acceptance criteria</h3>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-body">{task.acceptanceCriteria??"No acceptance criteria recorded."}</p>
      </section>
      <section className="mt-5 rounded-lg border border-border bg-surface-subtle p-3">
        <h3 className="text-sm font-semibold">Done when</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm text-body">{task.acceptanceCriteria || "No criteria recorded."}</p>
        {task.status === "BLOCKED" ? <p role="alert" className="mt-2 rounded-md border border-warning-border bg-warning-subtle p-2 text-sm">
          Blocked: {task.blockerReason || "No blocker note recorded."}
        </p> : null}
      </section>
      <h3 className="mt-5 text-sm font-semibold">Comments</h3>
      <ProjectTaskComments projectId={projectId} taskId={task.id}
        updatedAt={task.updatedAt.toISOString()}
        canPost={task.assigneeMembershipId === currentMembershipId && Boolean(currentMembershipId)}/>
      <h3 className="mt-5 text-sm font-semibold">Task actions</h3>
      <LearnerTaskStatusActions projectId={projectId} task={task} currentMembershipId={currentMembershipId} />
      <section className="mt-5 rounded-lg border border-border p-3" aria-label="Task Activity">
        <h3 className="font-semibold">Activity</h3>
        {activityEvents.length?<ol className="mt-2 space-y-2 text-xs text-body">
          {activityEvents.map((event,index)=><li key={index}>
            {event.summary} · {event.actorDisplayName??"Project member"} ·
            {" "}{new Intl.DateTimeFormat("en-IN",{
              dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
            }).format(event.occurredAt)}
          </li>)}
        </ol>:<p className="mt-2 text-xs text-muted-foreground">No task activity yet.</p>}
      </section>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={learnerBoardTaskWorkspaceHref(projectId,filters,task.id)}
          onClick={() => { navigatingRef.current.startNavigation(); }}
          className="inline-flex min-h-11 sm:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-primary-foreground">
          Open task actions in Board
        </Link>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">Submission review and additional task details are available in the full Board.</p>
    </Dialog>
  );
}
