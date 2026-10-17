import Link from "next/link";
import type { ProjectParticipantListQuery } from "./project-participant-list-controls";
import { learnerProjectMobileFilterSummary } from "@/modules/projects/learner-project-mobile-filter-model";

const statuses = [
  ["CURRENT","Current only"],["ACTIVE","Active"],["IN_PROGRESS","In progress"],
  ["READY","Ready"],["BLOCKED","Blocked"],["ARCHIVED","Archived"],
] as const;

/** Learner-only compact fallback. Desktop and Mentor controls are unchanged. */
export function LearnerProjectMobileFilters({
  query,
}: {
  query: ProjectParticipantListQuery;
}) {
  const active=learnerProjectMobileFilterSummary(query);
  return (
    <section className="space-y-2 sm:hidden" aria-label="Mobile project filters">
      <details className="rounded-xl border border-border bg-surface">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground">
          <span>Search &amp; filters</span>
          <span className="text-muted-foreground">
            {active.count ? String(active.count)+" active" : "All projects"}
          </span>
        </summary>
        <form method="get" action="/learn/projects" className="grid gap-3 border-t border-border px-4 py-4">
          <label className="grid gap-1 text-sm font-semibold text-foreground">
            Search Projects
            <input type="search" name="search" maxLength={100}
              defaultValue={query.search ?? ""}
              placeholder="Search project title, course or slug"
              className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal text-foreground" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-foreground">
            Project status
            <select name="status" defaultValue={query.status ?? ""}
              className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal text-foreground">
              <option value="">All statuses</option>
              {statuses.map(([value,label])=>(
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-foreground">
            Attention
            <select name="attention" defaultValue={query.attention ?? ""}
              className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal text-foreground">
              <option value="">All projects</option>
              <option value="LEARNER_ACTION">Needs my action</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-foreground">
            Work attention
            <select name="work" defaultValue={query.work ?? ""}
              className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal text-foreground">
              <option value="">All work</option>
              <option value="BLOCKED">Has blocked tasks</option>
              <option value="NO_TASKS">No tracked tasks yet</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-foreground">
            Sort projects
            <select name="sort" defaultValue={query.sort ?? "RECENT"}
              className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground">
              <option value="RECENT">Recently updated</option>
              <option value="TITLE">Title A–Z</option>
              <option value="PROGRESS">Least progress first</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-foreground">
            Results per page
            <select name="pageSize" defaultValue={String(query.pageSize ?? 25)}
              className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal text-foreground">
              {[10,25,50].map(value=>(
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button type="submit" className="min-h-11 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Apply</button>
            <Link href="/learn/projects"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-semibold text-body">
              Clear
            </Link>
          </div>
        </form>
      </details>
      {active.count > 0 ? (
        <p className="m-0 text-xs leading-5 text-muted-foreground" role="status">
          Active: {active.labels.join(" · ")}
        </p>
      ) : null}
    </section>
  );
}
