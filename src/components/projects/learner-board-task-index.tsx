import Link from "next/link";
import { learnerBoardTaskHref, type LearnerTaskBoardUrlFilters } from "@/modules/projects/learner-board-task-detail-model";

export function LearnerBoardTaskIndex({
  projectId, tasks, filters,
}: {
  projectId:string;
  tasks:readonly {id:string;title:string;status:string;priority:string}[];
  filters:LearnerTaskBoardUrlFilters;
}) {
  if(!tasks.length)return null;
  return (
    <details className="rounded-xl border border-border bg-surface px-4 py-3">
      <summary className="min-h-11 cursor-pointer text-sm font-semibold text-foreground">
        Open task details · {tasks.length} matching
      </summary>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {tasks.map(task=>(
          <li key={task.id}>
            <Link href={learnerBoardTaskHref(projectId,filters,task.id)}
              className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm text-primary-text hover:bg-muted">
              <span className="min-w-0 truncate">{task.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{task.status}</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
