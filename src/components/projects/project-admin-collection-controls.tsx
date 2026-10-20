import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type ProjectAdminCollectionQuery = {
  view?:"cards"|"table";
  fromMentorId?: string;
  riskBucket?: "STALLED" | "BLOCKER" | "REVIEW";
  riskSort?: "INACTIVE" | "WORKSPACE" | "SEVERITY";
  q?: string;
  status?:
    | "PLANNED"
    | "ACTIVE"
    | "COMPLETED"
    | "ARCHIVED";
  submissionStatus?:
    | "DRAFT"
    | "SUBMITTED"
    | "CHANGES_REQUESTED"
    | "APPROVED"
    | "UNDER_REVIEW"
    | "LOCKED"
    | "DRAFT_REVISING";
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
  "UNDER_REVIEW",
  "LOCKED",
  "DRAFT_REVISING",
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
  includeRiskSort = false,
  legacyWorkspaces = false,
  filterView,
}: {
  query: ProjectAdminCollectionQuery;
  includeSubmissionStatus?: boolean;
  includeRiskSort?: boolean;
  legacyWorkspaces?: boolean;
  filterView?: "NOT_SUBMITTED";
}) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 border-b border-border pb-4"
    >
      <label className="grid gap-1 text-[13px] font-semibold text-body">
        Search
        <Input
          name={legacyWorkspaces ? "search" : "q"}
          type="search"
          defaultValue={query.q ?? ""}
          placeholder={legacyWorkspaces ? "Search title or slug" : "Workspace title or slug"}
          className="min-w-56"
        />
      </label>
      <label className="grid gap-1 text-[13px] font-semibold text-body">
        Workspace status
        <Select
          name="status"
          defaultValue={query.status ?? ""}
          className=""
        >
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {label(status)}
            </option>
          ))}
        </Select>
      </label>
      {filterView?<input type="hidden" name="view" value={filterView}/>:query.view?<input type="hidden" name="view" value={query.view}/>:null}
      {query.fromMentorId ? <input type="hidden" name="fromMentorId" value={query.fromMentorId} /> : null}
      {query.riskBucket ? <input type="hidden" name="riskBucket" value={query.riskBucket} /> : null}
      {includeRiskSort ? (
        <label className="grid gap-1 text-[13px] font-semibold text-body">
          Sort by
          <Select name="riskSort" defaultValue={query.riskSort??"INACTIVE"}
            className="">
            <option value="INACTIVE">Inactive</option>
            <option value="SEVERITY">Severity</option>
            <option value="WORKSPACE">Workspace</option>
          </Select>
        </label>
      ) : null}
      {includeSubmissionStatus ? (
        <label className="grid gap-1 text-[13px] font-semibold text-body">
          Submission status
          <Select
            name="submissionStatus"
            defaultValue={
              query.submissionStatus ?? ""
            }
            className=""
          >
            <option value="">All submissions</option>
            {SUBMISSION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status==="UNDER_REVIEW"?"Under Review":status==="DRAFT_REVISING"?"Draft (revising)":label(status)}
              </option>
            ))}
          </Select>
        </label>
      ) : null}
      <label className="grid gap-1 text-[13px] font-semibold text-body">
        Rows
        <Select
          name="pageSize"
          defaultValue={String(
            query.pageSize ?? (legacyWorkspaces ? 20 : 25),
          )}
          className=""
        >
          {[10, 20, 25, 50, 100].filter((size) => !legacyWorkspaces || size !== 25).map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </label>
      <Button
        type="submit"
        className=""
      >
        Apply
      </Button>
      <Link
        href={filterView?"?view=NOT_SUBMITTED":"?"}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-[768px]:min-h-9"
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
    if (query.q) params.set(basePath === "/admin/projects" ? "search" : "q", query.q);
    if (query.view) params.set("view", query.view);
    if (query.fromMentorId) params.set("fromMentorId", query.fromMentorId);
    if (query.riskBucket) params.set("riskBucket", query.riskBucket);
    if (query.riskSort) params.set("riskSort", query.riskSort);
    if (query.status) {
      params.set("status", query.status);
    }
    if (query.submissionStatus) {
      params.set(
        "submissionStatus",
        query.submissionStatus,
      );
    }
    if (query.pageSize && !(basePath === "/admin/projects" && query.pageSize === 20)) {
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
      <div className="flex flex-wrap gap-2">
        <Link
          href={href(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={
            "inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 " +
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
          tabIndex={page >= totalPages ? -1 : undefined}
          className={
            "inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 " +
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
