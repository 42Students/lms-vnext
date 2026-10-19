import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PersonMembershipActions } from "@/components/admin/person-membership-actions";
import { PersonOnboardDialog } from "@/components/admin/person-onboard-dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { PEOPLE_PAGE_SIZE, peoplePageState } from "@/modules/admin-ui/people-pagination";
import { collegePeopleHasFilters, collegePeopleDirectoryHref, parseCollegePeopleDirectorySearchParams, type CollegePeopleDirectoryFilter } from "@/modules/people/college-people-directory-model";
import { listCollegePeopleWithRuntime } from "@/modules/people/runtime";
import type { PersonMembershipView } from "@/modules/people/service";
import { collegePeopleExportHref } from "@/modules/people/college-people-export-model";
import { COLLEGE_LEGACY_PAGE_TITLES } from "@/modules/people/college-page-title-model";

type Search = Record<string, string | string[] | undefined>;
function collegePeopleManageHref(filter: CollegePeopleDirectoryFilter) {
  return collegePeopleDirectoryHref(filter).replace("/college/people", "/college/people/manage");
}

const columns: DataTableColumn<PersonMembershipView>[] = [
  { key: "person", header: "Person", mobilePriority: "primary", mobileLabel: "Person", cell: person => (
    <div className="min-w-32">
      <p className="m-0 font-semibold text-foreground">{person.user.displayName || "Unnamed person"}</p>
      <p className="mt-1 break-all text-xs text-muted-foreground">
        {person.user.email || person.user.phoneE164 || "No contact detail"}
      </p>
    </div>
  ) },
  { key: "roles", header: "Roles", mobileLabel: "Roles", cell: person => person.membership.roles.join(", ") || "No roles recorded" },
  { key: "status", header: "Status", mobileLabel: "Status", cell: person => (
    <StatusBadge tone={person.membership.status === "ACTIVE" ? "success" :
      person.membership.status === "SUSPENDED" ? "warning" : "neutral"}>
      {person.membership.status}
    </StatusBadge>
  ) },
  { key: "actions", header: <span className="sr-only">Actions</span>, mobileLabel: "Actions", mobilePriority: "action", className: "text-right",
    cell: person => (
      <PersonMembershipActions membershipId={person.membership.id}
        collegeId={person.membership.collegeId}
        displayName={person.user.displayName || "Person"}
        roles={person.membership.roles} status={person.membership.status} />
    ) },
];

export default async function CollegePeoplePage({ searchParams }: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "COLLEGE_ADMIN")) redirect("/dashboard");
  const raw = await searchParams;
  let filter:CollegePeopleDirectoryFilter|null=null;
  try{filter=parseCollegePeopleDirectorySearchParams(raw);}catch{filter=null;}

  if (!filter) {
    return <div className="space-y-5">
      <PageHeader eyebrow="College Admin" title={COLLEGE_LEGACY_PAGE_TITLES.peopleDirectory} />
      <ErrorState title="Invalid directory filters"
        description="Check the search, role, status or page. No people were loaded."
        action={<Link href="/college/people/manage" className="font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-11 inline-flex items-center">Clear filters</Link>} />
    </div>;
  }
  const people = await listCollegePeopleWithRuntime(context, {
    collegeId: membership.collegeId,
    limit: PEOPLE_PAGE_SIZE, offset: (filter.page - 1) * PEOPLE_PAGE_SIZE,
    q: filter.q, role: filter.role, status: filter.status,
  });
  const pagination = peoplePageState(filter.page, people.pagination.total);
  if (filter.page !== pagination.page) {
    redirect(collegePeopleManageHref({ ...filter, page: pagination.page }));
  }
  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin" title={COLLEGE_LEGACY_PAGE_TITLES.peopleDirectory}
      description="Manage college memberships, roles and lifecycle. For the read-only legacy contact tabs, open Contacts."
      actions={<div className="flex flex-wrap items-center gap-3"><Link href="/college/groups"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Student groups</Link><Link href="/college/contacts" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Browse contacts</Link><Link href={collegePeopleExportHref(filter)} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Export filtered CSV</Link><PersonOnboardDialog collegeId={membership.collegeId} /></div>} />
    <section className="border-t border-border pt-4" aria-label="People filters">
      <form action="/college/people/manage" method="get" role="search" className="flex flex-wrap items-end gap-3">
        <label className="grid min-w-44 flex-1 gap-1 text-sm font-semibold text-body">Name, email or phone
          <Input name="q" type="search" maxLength={100} defaultValue={filter.q}
            className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-base sm:text-sm" />
        </label>
        <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Role
          <Select name="role" defaultValue={filter.role}
            className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-base sm:text-sm">
            <option value="ALL">All roles</option>
            <option value="LEARNER">Learner</option>
            <option value="FACULTY">Faculty</option>
            <option value="COLLEGE_ADMIN">College Admin</option>
            <option value="MENTOR">Mentor</option>
            <option value="TPO">TPO</option>
          </Select>
        </label>
        <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Membership
          <Select name="status" defaultValue={filter.status}
            className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-base sm:text-sm">
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="ENDED">Ended</option>
          </Select>
        </label>
        <Button variant="primary" type="submit" className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary inline-flex items-center">Apply</Button>
        <Link href="/college/people" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear</Link>
      </form>
    </section>
    <section className="space-y-2" aria-label="Filtered people">
      <p className="text-sm text-muted-foreground">{pagination.total} matching membership{pagination.total === 1 ? "" : "s"}</p>
      <DataTable caption="College memberships" columns={columns} rows={people.items}
        getRowKey={person => person.membership.id}
        empty={<div role="status" className="space-y-3 text-sm text-body">
          <p>{collegePeopleHasFilters(filter)
            ? "No memberships match the selected People filters."
            : "No memberships are recorded in this college yet."}</p>
          {collegePeopleHasFilters(filter) ? <Link href="/college/people/manage"
            className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear People filters</Link> : null}
        </div>} />
    </section>
    <nav aria-label="People directory pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">
        Page {pagination.page} of {pagination.pages} · {pagination.first}–{pagination.last} of {pagination.total}
      </span>
      <div className="flex flex-wrap gap-3">
        {pagination.hasPrevious ? <Link href={collegePeopleManageHref({ ...filter, page: filter.page - 1 })}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Previous</Link> : null}
        {pagination.hasNext ? <Link href={collegePeopleManageHref({ ...filter, page: filter.page + 1 })}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next</Link> : null}
      </div>
    </nav>
    <p className="text-xs text-muted-foreground">The CSV includes at most 1,000 matching memberships and visibly discloses truncation. Roles are membership grants, not separate people. A multi-role person may appear under multiple role filters. Profile and lifecycle actions are governed by existing permissions.</p>
  </div>;
}
