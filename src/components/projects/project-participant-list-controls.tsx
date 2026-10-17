import Link from "next/link";

export type ProjectParticipantListQuery = {
  search?: string;
  status?:
    | "CURRENT"
    | "PLANNED"
    | "ACTIVE"
    | "COMPLETED"
    | "ARCHIVED" | "IN_PROGRESS" | "READY" | "BLOCKED";
  assignment?: "PRIMARY" | "SUPPORTING";
  attention?:
    | "MENTOR_REVIEW"
    | "MENTOR_REQUESTED"
    | "MENTOR_STALLED"
    | "MENTOR_MEETING_SOON"
    | "MENTOR_ANY_ATTENTION"
    | "MENTOR_NO_ATTENTION"
    | "LEARNER_ACTION" | "BLOCKED";
  work?: "BLOCKED" | "NO_TASKS" | "HAS_OPEN_TASKS" | "ALL_DONE" | "HAS_DONE_TASKS";
  sort?: "RECENT" | "TITLE" | "PROGRESS" | "PROGRESS_DESC" | "OPEN_TASKS" | "TEAM_SIZE_DESC" | "TEAM_SIZE_ASC";
  page?: number;
  pageSize?: number;
};

const statusOptions = [
  ["CURRENT", "Current only"],
  ["PLANNED", "Planned"],
  ["ACTIVE", "Active"],
  ["COMPLETED", "Completed"],
  ["ARCHIVED", "Archived"],
] as const;
const mentorStatusOptions = [
 ["CURRENT","Current only"],["ACTIVE","Active"],["IN_PROGRESS","In progress"],
 ["READY","Ready"],["BLOCKED","Blocked"],["ARCHIVED","Archived"],
] as const;

export function ProjectParticipantListControls({
  basePath,
  query,
  mentor,
  learner,
}: {
  basePath: string;
  query: ProjectParticipantListQuery;
  mentor?: boolean;
  learner?: boolean;
}) {
  return (
    <form
      method="get"
      action={basePath}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
        Search
        <input
          name="search"
          type="search"
          defaultValue={query.search ?? ""}
          aria-label="Search my projects"
          placeholder="Search project title, course or slug"
          className="min-w-60 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
        />
      </label>

      <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
        Status
        <select
          name="status"
          defaultValue={query.status ?? ""}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
        >
          <option value="">All statuses</option>
          {(mentor?mentorStatusOptions:statusOptions).map(
            ([value, label]) => (
              <option
                key={value}
                value={value}
              >
                {label}
              </option>
            ),
          )}
          {learner?<><option value="IN_PROGRESS">In progress</option>
            <option value="READY">Ready</option>
            <option value="BLOCKED">Blocked</option></>:null}
        </select>
      </label>

      {mentor || learner ? (
        <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
          Attention
          <select
            name="attention"
            defaultValue={
              query.attention ?? ""
            }
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
          >
            <option value="">
              All attention states
            </option>
            {mentor ? (
              <>
                <option value="MENTOR_REVIEW">Needs my review</option>
                <option value="MENTOR_REQUESTED">Meeting requests</option>
                <option value="MENTOR_STALLED">Stalled projects</option>
                <option value="MENTOR_MEETING_SOON">Meeting soon</option>
                <option value="MENTOR_ANY_ATTENTION">Any attention</option>
                <option value="MENTOR_NO_ATTENTION">No recorded attention</option>
              </>
            ) : null}
            {learner ? (
              <>
                <option value="LEARNER_ACTION">Needs my action</option>
                <option value="BLOCKED">Blocked</option>
              </>
            ) : null}
          </select>
        </label>
      ) : null}

      {mentor ? (<label className="grid gap-1 text-xs font-semibold text-muted-foreground">Sort
        <select name="sort" defaultValue={query.sort ?? "RECENT"} className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground">
          <option value="RECENT">Recently updated</option><option value="TITLE">Title A–Z</option><option value="PROGRESS">Least recorded progress first</option><option value="PROGRESS_DESC">Most recorded progress first</option><option value="OPEN_TASKS">Most open tasks first</option><option value="TEAM_SIZE_DESC">Largest active team first</option><option value="TEAM_SIZE_ASC">Smallest active team first</option>
        </select></label>) : null}
      {mentor ? (<label className="grid gap-1 text-xs font-semibold text-muted-foreground">Assignment
        <select name="assignment" defaultValue={query.assignment ?? ""}
          className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground">
          <option value="">All Mentor assignments</option><option value="PRIMARY">Primary mentor</option><option value="SUPPORTING">Supporting mentor</option>
        </select>
      </label>) : null}

      {mentor ? (
        <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
          Recorded task coverage
          <select name="work" defaultValue={query.work ?? ""}
            className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground">
            <option value="">All task coverage</option>
            <option value="NO_TASKS">No tracked tasks</option>
            <option value="HAS_OPEN_TASKS">Open tasks recorded</option>
            <option value="ALL_DONE">All recorded tasks done</option>
            <option value="HAS_DONE_TASKS">Some recorded tasks done</option>
          </select>
        </label>
      ) : null}
      {learner ? (
        <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
          Work attention
          <select name="work" defaultValue={query.work ?? ""}
            className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground">
            <option value="">All work</option>
            <option value="BLOCKED">Has blocked tasks</option>
            <option value="NO_TASKS">No tracked tasks yet</option>
          </select>
        </label>
      ) : null}
      {learner ? (
        <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
          Sort projects
          <select name="sort" defaultValue={query.sort ?? "RECENT"}
            className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground">
            <option value="RECENT">Recently updated</option>
            <option value="TITLE">Title A–Z</option>
            <option value="PROGRESS">Least progress first</option>
          </select>
        </label>
      ) : null}
      <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
        Rows
        <select
          name="pageSize"
          defaultValue={String(
            query.pageSize ?? 25,
          )}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
        >
          {(learner||mentor?[10,25,50]:[25,50,100]).map((size) => (
            <option
              key={size}
              value={size}
            >
              {size}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Apply
      </button>
      <Link
        href={basePath}
        className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-body hover:bg-muted"
      >
        Clear filters
      </Link>
    </form>
  );
}

export function ProjectParticipantPagination({
  basePath,
  query,
  page,
  totalPages,
  total,
}: {
  basePath: string;
  query: ProjectParticipantListQuery;
  page: number;
  totalPages: number;
  total: number;
}) {
  function href(target: number) {
    const params = new URLSearchParams();
    if (query.search) {
      params.set("search", query.search);
    }
    if (query.status) {
      params.set("status", query.status);
    }
    if (query.assignment) params.set("assignment", query.assignment);
    if (query.attention) {
      params.set(
        "attention",
        query.attention,
      );
    }
    if (query.work) params.set("work", query.work);
    if (query.sort && query.sort !== "RECENT") params.set("sort", query.sort);
    if (
      query.pageSize &&
      query.pageSize !== 25
    ) {
      params.set(
        "pageSize",
        String(query.pageSize),
      );
    }
    if (target > 1) {
      params.set("page", String(target));
    }
    const value = params.toString();
    return value
      ? basePath + "?" + value
      : basePath;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-body">
      <p className="m-0">
        {(basePath==="/learn/projects"||basePath==="/mentor/projects")
          ? ((total===0?0:(page-1)*(query.pageSize??25)+1)+"–"+
             Math.min(total,page*(query.pageSize??25))+" of "+total+" projects")
          : <>{total} result{total===1?"":"s"} · Page {page} of {totalPages}</>}
      </p>
      <div className="flex gap-2">
        <Link
          href={href(
            Math.max(1, page - 1),
          )}
          aria-disabled={page <= 1}
          className={
            "rounded-lg border border-border px-3 py-2 font-semibold " +
            (page <= 1
              ? "pointer-events-none opacity-50"
              : "hover:bg-muted")
          }
        >
          Previous
        </Link>
        <Link
          href={href(
            Math.min(
              totalPages,
              page + 1,
            ),
          )}
          aria-disabled={
            page >= totalPages
          }
          className={
            "rounded-lg border border-border px-3 py-2 font-semibold " +
            (page >= totalPages
              ? "pointer-events-none opacity-50"
              : "hover:bg-muted")
          }
        >
          Next
        </Link>
      </div>
    </div>
  );
}
