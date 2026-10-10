import Link from "next/link";

export type ProjectAdminCollectionQuery = {
  q?: string;
  status?: string;
  submissionStatus?: string;
  page?: number;
  pageSize?: number;
};

const PROJECT_STATUSES = [
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
] as const;

const SUBMISSION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "CHANGES_REQUESTED",
  "APPROVED",
] as const;

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

export function ProjectAdminFilters({
  query,
  includeSubmissionStatus = false,
}: {
  query: ProjectAdminCollectionQuery;
  includeSubmissionStatus?: boolean;
}) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
        Search
        <input
          name="q"
          type="search"
          defaultValue={query.q ?? ""}
          placeholder="Workspace title or slug"
          className="min-w-56 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
        Workspace status
        <select
          name="status"
          defaultValue={query.status ?? ""}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
        >
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {label(status)}
            </option>
          ))}
        </select>
      </label>
      {includeSubmissionStatus ? (
        <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
          Submission status
          <select
            name="submissionStatus"
            defaultValue={
              query.submissionStatus ?? ""
            }
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
          >
            <option value="">All submissions</option>
            {SUBMISSION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {label(status)}
              </option>
            ))}
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
            <option key={size} value={size}>
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
        href="?"
        className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-body hover:bg-muted"
      >
        Clear
      </Link>
    </form>
  );
}

export function ProjectAdminPagination({
  basePath,
  query,
  page,
  totalPages,
  total,
}: {
  basePath: string;
  query: ProjectAdminCollectionQuery;
  page: number;
  totalPages: number;
  total: number;
}) {
  const href = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.status) {
      params.set("status", query.status);
    }
    if (query.submissionStatus) {
      params.set(
        "submissionStatus",
        query.submissionStatus,
      );
    }
    if (query.pageSize) {
      params.set(
        "pageSize",
        String(query.pageSize),
      );
    }
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    const value = params.toString();
    return value
      ? basePath + "?" + value
      : basePath;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-body">
      <p className="m-0">
        {total} result{total === 1 ? "" : "s"} ·
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={href(Math.max(1, page - 1))}
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
            Math.min(totalPages, page + 1),
          )}
          aria-disabled={page >= totalPages}
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
