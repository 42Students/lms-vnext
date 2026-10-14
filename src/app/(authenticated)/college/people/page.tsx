import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PersonMembershipActions } from "@/components/admin/person-membership-actions";
import { PersonOnboardDialog } from "@/components/admin/person-onboard-dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { PEOPLE_PAGE_SIZE, peoplePageState } from "@/modules/admin-ui/people-pagination";
import { collegePeopleDirectoryHref, collegePeopleDirectoryFilterSchema } from "@/modules/people/college-people-directory-model";
import { listCollegePeopleWithRuntime } from "@/modules/people/runtime";
import type { PersonMembershipView } from "@/modules/people/service";
import { collegePeopleExportHref } from "@/modules/people/college-people-export-model";

type Search = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

const columns: DataTableColumn<PersonMembershipView>[] = [
  { key: "person", header: "Person", cell: person => (
    <div className="min-w-32">
      <p className="m-0 font-semibold text-foreground">{person.user.displayName || "Unnamed person"}</p>
      <p className="mt-1 break-all text-xs text-muted-foreground">
        {person.user.email || person.user.phoneE164 || "No contact detail"}
      </p>
    </div>
  ) },
  { key: "roles", header: "Roles", cell: person => person.membership.roles.join(", ") || "No roles recorded" },
  { key: "status", header: "Status", cell: person => (
    <StatusBadge tone={person.membership.status === "ACTIVE" ? "success" :
      person.membership.status === "SUSPENDED" ? "warning" : "neutral"}>
      {person.membership.status}
    </StatusBadge>
  ) },
  { key: "actions", header: <span className="sr-only">Actions</span>, className: "text-right",
    cell: person => (
      <PersonMembershipActions membershipId={person.membership.id}
        collegeId={person.membership.collegeId}
        displayName={person.user.displayName || "Person"}
        roles={person.membership.roles} status={person.membership.status} />
    ) },
];

export default async function CollegePeoplePage({ searchParams }: { searchParams: Promise<Search> }) {
  const raw = await searchParams;
  const parsed = collegePeopleDirectoryFilterSchema.safeParse({
    q: first(raw.q), role: first(raw.role), status: first(raw.status), page: first(raw.page),
  });
  const context = await getCurrentRequestContext();
  const membership = context.membership;
  if (!membership) redirect("/dashboard");

  if (!parsed.success) {
    return <div className="space-y-5">
      <PageHeader eyebrow="College Admin" title="People" />
      <ErrorState title="Invalid directory filters"
        description="Check the search, role, status or page. No people were loaded."
        action={<Link href="/college/people" className="font-semibold text-primary-text">Clear filters</Link>} />
    </div>;
  }
  const filter = parsed.data;
  const people = await listCollegePeopleWithRuntime(context, {
    collegeId: membership.collegeId,
    limit: PEOPLE_PAGE_SIZE, offset: (filter.page - 1) * PEOPLE_PAGE_SIZE,
    q: filter.q, role: filter.role, status: filter.status,
  });
  const pagination = peoplePageState(filter.page, people.pagination.total);
  if (filter.page !== pagination.page) {
    redirect(collegePeopleDirectoryHref({ ...filter, page: pagination.page }));
  }
  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin" title="People"
      description="Search this college’s memberships by name, email, phone, role and status."
      actions={<div className="flex flex-wrap items-center gap-3"><Link href={collegePeopleExportHref(filter)} className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Export filtered CSV</Link><PersonOnboardDialog collegeId={membership.collegeId} /></div>} />
    <section className="rounded-xl border border-border bg-surface p-4" aria-label="People filters">
      <form action="/college/people" method="get" className="flex flex-wrap items-end gap-3">
        <label className="grid min-w-44 flex-1 gap-1 text-sm font-semibold text-body">Name, email or phone
          <input name="q" type="search" maxLength={100} defaultValue={filter.q}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Role
          <select name="role" defaultValue={filter.role}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="ALL">All roles</option>
            <option value="LEARNER">Learner</option>
            <option value="FACULTY">Faculty</option>
            <option value="COLLEGE_ADMIN">College Admin</option>
            <option value="MENTOR">Mentor</option>
            <option value="TPO">TPO</option>
          </select>
        </label>
        <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Membership
          <select name="status" defaultValue={filter.status}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="ENDED">Ended</option>
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Apply</button>
        <Link href="/college/people" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Clear</Link>
      </form>
    </section>
    <section className="space-y-2" aria-label="Filtered people">
      <p className="text-sm text-muted-foreground">{pagination.total} matching membership{pagination.total === 1 ? "" : "s"}</p>
      {people.items.length ? <DataTable columns={columns} rows={people.items}
        getRowKey={person => person.membership.id} /> :
        <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
          No matching memberships. Clear filters or onboard a person to this college.
        </p>}
    </section>
    <nav aria-label="People directory pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">
        Page {pagination.page} of {pagination.pages} · {pagination.first}–{pagination.last} of {pagination.total}
      </span>
      <div className="flex flex-wrap gap-3">
        {pagination.hasPrevious ? <Link href={collegePeopleDirectoryHref({ ...filter, page: filter.page - 1 })}
          className="inline-flex min-h-10 items-center rounded-md border border-border px-4 font-semibold text-primary-text">Previous</Link> : null}
        {pagination.hasNext ? <Link href={collegePeopleDirectoryHref({ ...filter, page: filter.page + 1 })}
          className="inline-flex min-h-10 items-center rounded-md border border-border px-4 font-semibold text-primary-text">Next</Link> : null}
      </div>
    </nav>
    <p className="text-xs text-muted-foreground">The CSV includes at most 1,000 matching memberships and visibly discloses truncation. Roles are membership grants, not separate people. A multi-role person may appear under multiple role filters. Profile and lifecycle actions are governed by existing permissions.</p>
  </div>;
}
