import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";

export type ProjectAdminCollectionQuery = {
  view?:"cards"|"table";
  fromMentorId?: string;
  focusedProjectId?:string;
  riskBucket?: "STALLED" | "BLOCKER" | "REVIEW";
  riskSort?: "INACTIVE" | "WORKSPACE" | "SEVERITY";
  q?: string;
  status?:
    | "PLANNED"
    | "ACTIVE"
    | "IN_PROGRESS"
    | "READY"
    | "BLOCKED"
    | "COMPLETED"
    | "ARCHIVED";
  sort?:"SUBMITTED_DESC"|"PENDING_DESC"|"REVISIONS_DESC";
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

/** Historic Ready is a readiness rollup; Blocked derives from risk,
 * not a lifecycle status. Do not mislabel persisted COMPLETED or ARCHIVED.
 */
export const LEGACY_WORKSPACE_FILTER_LABELS=[
 "Active","In progress","Ready","Blocked","Archived",
] as const;
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
  atRiskHref = "/admin/projects/at-risk",
  filterView,
}: {
  query: ProjectAdminCollectionQuery;
  includeSubmissionStatus?: boolean;
  includeRiskSort?: boolean;
  legacyWorkspaces?: boolean;
  atRiskHref?:string;
  filterView?: "NOT_SUBMITTED";
}) {
  return (
    <form
      method="get"
      className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] md:grid-cols-2 min-[992px]:grid-cols-4"
    >
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
        Search
        <Input
          name={legacyWorkspaces ? "search" : "q"}
          type="search"
          defaultValue={query.q ?? ""}
          placeholder={legacyWorkspaces ? "Search title or slug" : "Workspace title or slug"}
          className="w-full min-w-0"
        />
      </label>
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
        Workspace status
        <Select
          name="status"
          defaultValue={query.status ?? ""}
          className="w-full"
        >
          <option value="">All statuses</option>
          {(legacyWorkspaces?
            (["ACTIVE","IN_PROGRESS","READY","BLOCKED","ARCHIVED",
              ...(query.status==="PLANNED"?["PLANNED" as const]:[]),
              ...(query.status==="COMPLETED"?["COMPLETED" as const]:[])] as const):
            PROJECT_STATUSES).map((status) => (
            <option key={status} value={status}>
              {label(status)}
            </option>
          ))}
        </Select>
      </label>
      {legacyWorkspaces?<p className="text-xs text-muted-foreground">
        Ready and Blocked use saved workspace phase and blocker signals.
        <Link href={atRiskHref} className="ml-1 font-semibold text-primary-text underline">
          View all risk signals</Link>
      </p>:null}
      {filterView?<input type="hidden" name="view" value={filterView}/>:query.view?<input type="hidden" name="view" value={query.view}/>:null}
      {query.fromMentorId ? <input type="hidden" name="fromMentorId" value={query.fromMentorId} /> : null}
      {query.focusedProjectId ? <input type="hidden" name="projectId" value={query.focusedProjectId} /> : null}
      {query.riskBucket ? <input type="hidden" name="riskBucket" value={query.riskBucket} /> : null}
      {query.sort&&query.sort!=="SUBMITTED_DESC"?
        <input type="hidden" name="sort" value={query.sort}/>:null}
      {includeRiskSort ? (
        <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
          Sort by
          <Select name="riskSort" defaultValue={query.riskSort??"INACTIVE"}
            className="w-full">
            <option value="INACTIVE">Inactive</option>
            <option value="SEVERITY">Severity</option>
            <option value="WORKSPACE">Workspace</option>
          </Select>
        </label>
      ) : null}
      {includeSubmissionStatus ? (
        <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
          Submission status
          <Select
            name="submissionStatus"
            defaultValue={
              query.submissionStatus ?? ""
            }
            className="w-full"
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
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
        Rows
        <Select
          name="pageSize"
          defaultValue={String(
            query.pageSize ?? (legacyWorkspaces ? 20 : 25),
          )}
          className="w-full"
        >
          {[10, 20, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </label>
      <Button
        type="submit"
        className="min-h-11 w-full md:min-h-9"
      >
        Apply
      </Button>
      <Link
        href={filterView?"?view=NOT_SUBMITTED":"?"}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
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
    if (query.focusedProjectId) params.set("projectId",query.focusedProjectId);
    if (query.riskBucket) params.set("riskBucket", query.riskBucket);
    if (query.riskSort) params.set("riskSort", query.riskSort);
    if (query.status) {
      params.set("status", query.status);
    }
    if(query.sort&&query.sort!=="SUBMITTED_DESC")params.set("sort",query.sort);
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
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm text-body">
      <p className="m-0 tabular-nums">
        {total} result{total === 1 ? "" : "s"} · Page {page} of {totalPages}
      </p>
      <Pagination page={page} pageCount={totalPages} hrefForPage={href}
        label="Project workspaces pages" />
    </div>
  );
}
