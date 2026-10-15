"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { learnerBoardTaskWorkspaceHref } from "@/modules/projects/learner-board-task-workflow-model";
import { learnerBoardTaskStatusLabel, learnerBoardTaskPriorityLabel } from "@/modules/projects/learner-board-task-status-label-model";
import { learnerBoardTaskStatusTone, learnerBoardTaskPriorityTone } from "@/modules/projects/learner-board-task-attention-tone-model";
import { StatusBadge } from "@/components/ui/status-badge";
import { useRouter } from "next/navigation";
import type { LearnerTaskBoardUrlFilters } from "@/modules/projects/learner-board-task-detail-model";
import { learnerBoardTaskHref } from "@/modules/projects/learner-board-task-detail-model";

export function LearnerBoardTaskDetailDialog({
  projectId, filters, task, sprintTitle,
}: {
  projectId:string;
  filters:LearnerTaskBoardUrlFilters;
  task:{
    id:string;title:string;description:string|null;acceptanceCriteria:string|null;
    status:string;priority:string;
  };
  sprintTitle:string|null;
}) {
  const ref=useRef<HTMLDialogElement>(null);
  const navigatingRef=useRef(false);
  const router=useRouter();
  const returnHref=learnerBoardTaskHref(projectId,filters);
  useEffect(()=>{
    const dialog=ref.current;
    if(!dialog)return;
    if(!dialog.open)dialog.showModal();
    return ()=>{if(dialog.open)dialog.close();};
  },[task.id]);
  return (
    <dialog ref={ref} aria-labelledby="learner-task-dialog-title"
      onClose={()=>{if(!navigatingRef.current)router.replace(returnHref);}}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[min(94vw,38rem)] overflow-y-auto rounded-xl border border-border bg-surface p-5 text-foreground shadow-xl backdrop:bg-black/50 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project Board task</p>
          <h2 id="learner-task-dialog-title" className="mt-1 break-words text-lg font-semibold">{task.title}</h2>
        </div>
        <form method="dialog">
          <button className="min-h-11 rounded-lg border border-border px-3 text-sm font-semibold" aria-label="Close task details">Close</button>
        </form>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-muted-foreground">Status</dt><dd className="mt-1"><StatusBadge tone={learnerBoardTaskStatusTone(task.status)}>{learnerBoardTaskStatusLabel(task.status)}</StatusBadge></dd></div>
        <div><dt className="text-muted-foreground">Priority</dt><dd className="mt-1"><StatusBadge tone={learnerBoardTaskPriorityTone(task.priority)}>{learnerBoardTaskPriorityLabel(task.priority)}</StatusBadge></dd></div>
        <div className="col-span-2"><dt className="text-muted-foreground">Sprint</dt><dd className="mt-1 font-semibold">{sprintTitle??"Not assigned"}</dd></div>
      </dl>
      <section className="mt-5">
        <h3 className="font-semibold">Details</h3>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-body">{task.description??"No task description provided."}</p>
      </section>
      <section className="mt-5">
        <h3 className="font-semibold">Acceptance criteria</h3>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-body">{task.acceptanceCriteria??"No acceptance criteria recorded."}</p>
      </section>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={learnerBoardTaskWorkspaceHref(projectId,filters,task.id)}
          onClick={() => { navigatingRef.current=true; }}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
          Open task actions in Board
        </Link>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">Actions and submissions use the authorized Project workspace, not this read-only preview.</p>
    </dialog>
  );
}
