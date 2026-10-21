import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/modules/permissions/policy";
import { canonicalCollegeGroupsOffset, collegeGroupsDirectoryHref, parseCollegeGroupsDirectoryParams } from "@/modules/groups/college-group-directory-query-model";
import { CollegeGroupActions } from "@/components/groups/college-group-actions";
import {
  GROUP_STATUSES,
  listCollegeGroups,
  type GroupListRow,
} from "@/modules/groups/admin-read-service";

const STATUS_TONE = {
  ACTIVE: "success",
  DRAFT: "neutral",
  CLOSED: "warning",
  ARCHIVED: "neutral",
} as const;

function label(kind: string) {
  return kind
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function capacityText(row: GroupListRow) {
  return row.capacity === null
    ? `${row.activeCount} members`
    : `${row.activeCount} / ${row.capacity}`;
}

export default async function CollegeGroupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  const membership = context.membership;
  if (!membership) redirect("/dashboard");

  requirePermission(context, "academics.manage", {
    organizationId: membership.organizationId, collegeId: membership.collegeId,
  });
  // The old Student Groups menu was hidden and replaced with People.
  // New standalone group CRUD is an independently releasable feature; do
  // not read group rosters or render mutations without an explicit release.
  if (process.env.COLLEGE_STUDY_GROUPS_RELEASED !== "true") redirect("/college/people");
  const filters = parseCollegeGroupsDirectoryParams(await searchParams);
  if (!filters) return <div className="min-w-0 space-y-4">
    <PageHeader title="Student Groups" />
    <ErrorState title="Invalid group filters"
      description="Choose a supported group type, status and page. Remove repeated or unrelated filters."
      action={<Link href="/college/groups" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] w-full md:w-auto">Clear filters</Link>}/>
  </div>;
  const { kind, status, offset } = filters;
  // The old Student Groups reader defaulted to ordinary study groups.
  // Keep ELECTIVE and PROJECT_TEAM groups visible only through an explicit
  // All-types filter; their actual mutations remain in their own modules.
  const effectiveKind=kind==="ALL"?undefined:kind??"STUDY_GROUP";

  const result = await listCollegeGroups(context, {
    collegeId: membership.collegeId,
    kind:effectiveKind,
    status,
    offset,
  });

  const { limit, total } = result.pagination;
  const canonicalOffset = canonicalCollegeGroupsOffset(offset,total,limit);
  if (canonicalOffset !== offset) redirect(collegeGroupsDirectoryHref({kind,status,offset:canonicalOffset}));
  const query = (next: number) => collegeGroupsDirectoryHref({
    kind, status, offset: next,
  });

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <PageHeader
        title="Student Groups"
        description={`Study groups in ${result.collegeName}. Elective and project teams are managed in their own modules.`}
        actions={<CollegeGroupActions />}
      />

      <form
        method="get"
        className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-[var(--lms-canvas-border)] pb-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
      >
        <label className="block min-w-0 w-full text-[var(--lms-font-sm)] text-[var(--lms-neutral-400)] font-semibold leading-4">
          <span className="mb-1 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Type
          </span>
          <Select name="kind" defaultValue={kind ?? "STUDY_GROUP"}>
            <option value="STUDY_GROUP">Study Group</option>
            <option value="ALL">All types</option>
            {result.kinds.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </Select>
        </label>
        <label className="block min-w-0 w-full text-[var(--lms-font-sm)] text-[var(--lms-neutral-400)] font-semibold leading-4">
          <span className="mb-1 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Status
          </span>
          <Select name="status" defaultValue={status ?? ""}>
            <option value="">Any status</option>
            {GROUP_STATUSES.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">
          Apply
        </Button>
        {kind || status ? (
          <Link
            href="/college/groups"
            className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
          >
            Clear filters
          </Link>
        ) : null}
      </form>

      <section aria-label="Group status summary" className="flex min-w-0 flex-wrap gap-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-3">
       <p className="text-sm text-body"><strong>{total}</strong> matching groups</p>
       <p className="text-sm text-body"><strong>{result.items.filter(row=>row.status==="ACTIVE").length}</strong> active on this page</p>
       <p className="text-xs text-muted-foreground">Student group changes are scoped to your selected college.</p>
      </section>
      {kind==="ALL"?<p role="status" className="text-xs text-muted-foreground">
       Electives-managed and Project Team-managed groups are included for reference only. Edit them in their corresponding module.
      </p>:null}
      {result.items.length === 0 ? (
        <EmptyState
          title="No groups found"
          action={kind || status ? <Link href="/college/groups" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link> : undefined}
          description={
            kind || status
              ? "No groups match these filters."
              : "This college has no student groups yet."
          }
        />
      ) : (
        <>
          <DataTable empty={<EmptyState title="No records to show" description="No records to show."/>}
            columns={[
              {
                key: "name",
                header: "Group",
                cell: (row: GroupListRow) => (
                  <Link
                    href={`/college/groups/${row.id}`}
                    className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
                  >
                    {row.name}
                  </Link>
                ),
              },
              { key: "kind", header: "Type", cell: (row) => label(row.kind) },
              {
                key: "status",
                header: "Status",
                cell: (row) => (
                  <StatusBadge
                    tone={
                      STATUS_TONE[row.status as keyof typeof STATUS_TONE] ??
                      "neutral"
                    }
                  >
                    {label(row.status)}
                  </StatusBadge>
                ),
              },
              { key: "capacity", header: "Members", cell: capacityText },
              {
                key: "queue",
                header: "Waitlisted",
                cell: (row) =>
                  row.waitlistedCount + row.requestedCount === 0
                    ? "—"
                    : `${row.waitlistedCount} waitlisted · ${row.requestedCount} requested`,
              },
              {
                key: "manage",
                header: "Manage",
                cell: (row) => row.kind === "STUDY_GROUP" ? (
                  <CollegeGroupActions group={row} />
                ) : <span className="text-xs text-muted-foreground">
                  {row.kind==="ELECTIVE_GROUP"?"Electives-managed":
                   row.kind==="PROJECT_TEAM"?"Project Team-managed":"Managed elsewhere"}
                </span>,
              },
              {
                key: "term",
                header: "Term",
                cell: (row) =>
                  [row.academicYear, row.semesterNumber ? `Sem ${row.semesterNumber}` : null]
                    .filter(Boolean)
                    .join(" · ") || "—",
              },
            ]}
            rows={result.items}
            getRowKey={(row) => row.id}
          />

          <div className="flex min-w-0 flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm tabular-nums text-[var(--lms-muted-text)]">
              Showing {(offset+1).toLocaleString("en-IN")}–{Math.min(offset+limit,total).toLocaleString("en-IN")} of {total.toLocaleString("en-IN")}
            </p>
            <Pagination label="Group pages" page={Math.floor(offset/limit)+1}
              pageCount={Math.ceil(total/limit)} hrefForPage={page=>query((page-1)*limit)} />
          </div>
        </>
      )}
    </div>
  );
}
