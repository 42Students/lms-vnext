import Link from "next/link";
import { learnerBoardEmptyState, learnerBoardActiveFilterCount } from "@/modules/projects/learner-project-board-model";
export function LearnerProjectBoardSearch({
  projectId, search, priority, sprintId, sprints, releaseId, releases, shown, total,
}: {projectId:string;search:string;priority:string;sprintId:string;sprints:readonly {id:string;title:string}[];releaseId:string;releases:readonly {id:string;title:string}[];shown:number;total:number}) {
  const base="/learn/projects/"+encodeURIComponent(projectId)+"?tab=board";
  const emptyState=learnerBoardEmptyState(total,shown);
  const activeCount=learnerBoardActiveFilterCount({search,priority,sprintId,releaseId});
  const form=(
      <form action={"/learn/projects/"+encodeURIComponent(projectId)}
        method="get" className="grid gap-3 py-3 sm:grid-cols-2 xl:grid-cols-3">
        <input type="hidden" name="tab" value="board" />
        <label className="flex-1 text-sm font-semibold text-foreground">
          Search tasks
          <input name="taskSearch" type="search" maxLength={100} defaultValue={search}
            placeholder="Task title or details" className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-semibold text-foreground">
          Priority
          <select name="priority" defaultValue={priority}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal">
            <option value="">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-foreground">
          Sprint
          <select name="sprintId" defaultValue={sprintId}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal">
            <option value="">All sprints</option>
            {sprints.map(sprint => <option key={sprint.id} value={sprint.id}>{sprint.title}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-foreground">
          Release
          <select name="releaseId" defaultValue={releaseId}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal">
            <option value="">All releases</option>
            {releases.map(release=>(
              <option key={release.id} value={release.id}>{release.title}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Apply</button>
        <Link href={base} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-body">Clear</Link>
      </form>
  );
  return (
    <section aria-label="Project Board filters" className="rounded-xl border border-border bg-surface p-4">
      <details className="sm:hidden">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-sm font-semibold text-foreground">
          <span>Board filters</span>
          <span className="text-muted-foreground">{activeCount} active</span>
        </summary>
        {form}
      </details>
      <div className="hidden sm:block">{form}</div>
      <p className="mt-3 text-sm text-muted-foreground" role="status">
        {shown} of {total} authorized tasks match
      </p>
      {emptyState === "NO_TASKS" ? (
        <p className="mt-2 text-sm text-body">No tasks have been assigned to this Project yet.</p>
      ) : emptyState === "FILTERED_EMPTY" ? (
        <p className="mt-2 text-sm text-body">
          No tasks match these filters. Clear them to return to the full Board.
        </p>
      ) : null}
    </section>
  );
}
