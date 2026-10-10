import Link from "next/link";

export type ProjectParticipantListQuery = {
  search?: string;
  status?:
    | "CURRENT"
    | "PLANNED"
    | "ACTIVE"
    | "COMPLETED"
    | "ARCHIVED";
  attention?: "MENTOR_REVIEW";
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

export function ProjectParticipantListControls({
  basePath,
  query,
  mentor,
}: {
  basePath: string;
  query: ProjectParticipantListQuery;
  mentor?: boolean;
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
          placeholder="Project title or slug"
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
          {statusOptions.map(
            ([value, label]) => (
              <option
                key={value}
                value={value}
              >
                {label}
              </option>
            ),
          )}
        </select>
      </label>

      {mentor ? (
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
              All projects
            </option>
            <option value="MENTOR_REVIEW">
              Needs my review
            </option>
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
          {[25, 50, 100].map((size) => (
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
        Clear
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
    if (query.attention) {
      params.set(
        "attention",
        query.attention,
      );
    }
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
        {total} result
        {total === 1 ? "" : "s"} · Page{" "}
        {page} of {totalPages}
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
