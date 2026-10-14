import Link from "next/link";
export function LearnerProjectBoardSearch({
  projectId, search, priority, shown, total,
}: {projectId:string;search:string;priority:string;shown:number;total:number}) {
  const base="/learn/projects/"+encodeURIComponent(projectId)+"?tab=board";
  return (
    <section aria-label="Project Board filters" className="rounded-xl border border-border bg-surface p-4">
      <form action={"/learn/projects/"+encodeURIComponent(projectId)}
        method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
        <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Apply</button>
        <Link href={base} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-body">Clear</Link>
      </form>
      <p className="mt-3 text-sm text-muted-foreground" role="status">
        {shown} of {total} authorized tasks match
      </p>
      {total > 0 && shown === 0 ? <p className="mt-2 text-sm text-body">No tasks match this search. Clear to see every task.</p> : null}
    </section>
  );
}
