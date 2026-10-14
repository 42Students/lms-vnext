"use client";
import { useEffect, useRef } from "react";
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
      onClose={()=>router.replace(returnHref)}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[min(94vw,38rem)] overflow-y-auto rounded-xl border border-border bg-surface p-5 text-foreground shadow-xl backdrop:bg-black/50 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project Board task</p>
          <h2 id="learner-task-dialog-title" className="mt-1 text-lg font-semibold">{task.title}</h2>
        </div>
        <form method="dialog">
          <button className="min-h-11 rounded-lg border border-border px-3 text-sm font-semibold" aria-label="Close task details">Close</button>
        </form>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-muted-foreground">Status</dt><dd className="mt-1 font-semibold">{task.status}</dd></div>
        <div><dt className="text-muted-foreground">Priority</dt><dd className="mt-1 font-semibold">{task.priority}</dd></div>
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
      <p className="mt-4 text-xs leading-5 text-muted-foreground">Task status changes and submissions remain available only through the authorized workspace controls.</p>
    </dialog>
  );
}
