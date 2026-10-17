import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
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

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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

  const params = await searchParams;
  const kind = one(params.kind) || undefined;
  const statusRaw = one(params.status);
  const status = GROUP_STATUSES.find((value) => value === statusRaw);
  const offset = Math.max(0, Number.parseInt(one(params.offset) ?? "0", 10) || 0);

  const result = await listCollegeGroups(context, {
    collegeId: membership.collegeId,
    kind,
    status,
    offset,
  });

  const { limit, total } = result.pagination;
  const query = (next: number) => {
    const search = new URLSearchParams();
    if (kind) search.set("kind", kind);
    if (status) search.set("status", status);
    if (next > 0) search.set("offset", String(next));
    const text = search.toString();
    return `/college/groups${text ? `?${text}` : ""}`;
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Student groups"
        description={`Study groups, project teams and elective groups in ${result.collegeName}.`}
        actions={<CollegeGroupActions />}
      />

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <label className="block min-w-[180px]">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Type
          </span>
          <Select name="kind" defaultValue={kind ?? ""}>
            <option value="">All types</option>
            {result.kinds.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </Select>
        </label>
        <label className="block min-w-[160px]">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {kind || status ? (
          <Link
            href="/college/groups"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline"
          >
            Clear filters
          </Link>
        ) : null}
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          title="No groups found"
          description={
            kind || status
              ? "No groups match these filters."
              : "This college has no student groups yet."
          }
        />
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: "name",
                header: "Group",
                cell: (row: GroupListRow) => (
                  <Link
                    href={`/college/groups/${row.id}`}
                    className="font-semibold text-primary-text hover:underline"
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
                header: "Waiting",
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
                ) : <span className="text-xs text-muted-foreground">Managed elsewhere</span>,
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

          <nav
            aria-label="Pagination"
            className="flex items-center justify-between text-sm text-muted-foreground"
          >
            <span>
              Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
            </span>
            <span className="flex gap-3">
              {offset > 0 ? (
                <Link
                  className="font-semibold text-primary-text hover:underline"
                  href={query(Math.max(0, offset - limit))}
                >
                  Previous
                </Link>
              ) : null}
              {offset + limit < total ? (
                <Link
                  className="font-semibold text-primary-text hover:underline"
                  href={query(offset + limit)}
                >
                  Next
                </Link>
              ) : null}
            </span>
          </nav>
        </>
      )}
    </div>
  );
}
