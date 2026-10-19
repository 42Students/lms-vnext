import { Input } from "@/components/ui/input";
import { Disclosure } from "@/components/ui/disclosure";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { learnerBoardEmptyState, learnerBoardActiveFilterCount } from "@/modules/projects/learner-project-board-model";
import { LEARNER_BOARD_STATUS_LABELS, learnerBoardStatusFilterHref, type LearnerBoardStatusCounts } from "@/modules/projects/learner-board-summary-model";
import { LEARNER_BOARD_PRIORITY_LABELS, learnerBoardPriorityFilterHref, type LearnerBoardPriorityCounts } from "@/modules/projects/learner-board-priority-model";
import type { LearnerBoardSort } from "@/modules/projects/learner-board-sort-model";
export function LearnerProjectBoardSearch({
  projectId, search, priority, status, taskSort, mine, sprintId, sprints, releaseId, releases, shown, total, statusCounts, priorityCounts,
}: {projectId:string;search:string;priority:string;status:string;taskSort:LearnerBoardSort;mine:boolean;sprintId:string;sprints:readonly {id:string;title:string}[];releaseId:string;releases:readonly {id:string;title:string}[];shown:number;total:number;statusCounts:LearnerBoardStatusCounts;priorityCounts:LearnerBoardPriorityCounts}) {
  const base="/learn/projects/"+encodeURIComponent(projectId)+"?tab=board";
  const emptyState=learnerBoardEmptyState(total,shown);
  const activeCount=learnerBoardActiveFilterCount({search,priority,status,sprintId,releaseId,taskSort,mine});
  const form=(
      <form action={"/learn/projects/"+encodeURIComponent(projectId)}
        method="get" className="grid gap-3 py-3 sm:grid-cols-2 xl:grid-cols-3">
        <input type="hidden" name="tab" value="board" />
        <label className="flex-1 text-sm font-semibold text-foreground">
          Search tasks
          <Input name="taskSearch" type="search" maxLength={100} defaultValue={search}
            placeholder="Task title or details" className="mt-1 min-h-9" />
        </label>
        <label className="text-sm font-semibold text-foreground">
          Priority
          <Select name="priority" defaultValue={priority}
            className="mt-1 min-h-9">
            <option value="">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </label>
        <label className="text-sm font-semibold text-foreground">
          Status
          <Select name="taskStatus" defaultValue={status}
            className="mt-1 min-h-9">
            <option value="">All statuses</option>
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="IN_REVIEW">In review</option>
            <option value="DONE">Done</option>
          </Select>
        </label>
        <label className="text-sm font-semibold text-foreground">Task order
          <Select name="taskSort" defaultValue={taskSort} className="mt-1 min-h-9">
            <option value="DEFAULT">Project order</option><option value="PRIORITY">Highest priority first</option>
            <option value="RECENT">Recently updated</option><option value="TITLE">Title A–Z</option>
          </Select>
        </label>
        <label className="text-sm font-semibold text-foreground">
          Sprint
          <Select name="sprintId" defaultValue={sprintId}
            className="mt-1 min-h-9">
            <option value="">All sprints</option>
            {sprints.map(sprint => <option key={sprint.id} value={sprint.id}>{sprint.title}</option>)}
          </Select>
        </label>
        <label className="text-sm font-semibold text-foreground">
          Release
          <Select name="releaseId" defaultValue={releaseId}
            className="mt-1 min-h-9">
            <option value="">All releases</option>
            {releases.map(release=>(
              <option key={release.id} value={release.id}>{release.title}</option>
            ))}
          </Select>
        </label>
        <label className="text-sm font-semibold text-foreground">Assignee
          <Select name="assignee" defaultValue={mine ? "mine" : ""} className="mt-1 min-h-9">
            <option value="">Everyone</option><option value="mine">Mine</option>
          </Select>
        </label>
        <Button type="submit" className="min-h-9">Apply</Button>
        <Link href={base} className="inline-flex min-h-9 sm:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body">Clear all</Link>
      </form>
  );
  return (
    <section aria-label="Project Board filters" className="border-b border-border pb-5">
      <Disclosure title={<span className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm font-semibold text-foreground"><span>Filters</span><span className="text-muted-foreground">{activeCount} active</span></span>} className="[&>summary]:min-h-9">
        {form}
      </Disclosure>

      <div className="space-y-3 border-t border-[var(--lms-canvas-border)] pt-3">
        <NeedsDoingChips label="Task counts by status:" selectedKey={status}
          items={LEARNER_BOARD_STATUS_LABELS.map(item => ({
            key: item.value, label: item.label, count: statusCounts[item.value],
            href: learnerBoardStatusFilterHref(projectId,
              {taskSearch:search,priority,status,sprintId,releaseId,taskSort,mine}, item.value),
          }))} />
        <NeedsDoingChips label="Task counts by priority:" selectedKey={priority}
          items={LEARNER_BOARD_PRIORITY_LABELS.map(item => ({
            key: item.value, label: item.label, count: priorityCounts[item.value],
            href: learnerBoardPriorityFilterHref(projectId,
              {taskSearch:search,priority,status,sprintId,releaseId,taskSort,mine}, item.value),
          }))} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground" role="status">
        {shown} of {total} authorized tasks match
      </p>
      {emptyState === "NO_TASKS" ? (
        <EmptyState title="No assigned tasks" description="No tasks have been assigned to this Project yet." />
      ) : emptyState === "FILTERED_EMPTY" ? (
        <EmptyState title="No matching tasks" description="No tasks match these filters. Clear them to return to the full Board." />
      ) : null}
    </section>
  );
}
