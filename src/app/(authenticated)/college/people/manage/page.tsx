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
import { EmptyState } from "@/components/ui/empty-state";
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
    return <div className="min-w-0 space-y-5">
      <PageHeader title={COLLEGE_LEGACY_PAGE_TITLES.peopleDirectory} />
      <ErrorState title="Invalid directory filters"
        description="Check the search, role, status or page. No people were loaded."
        action={<Link href="/college/people/manage" className="md:min-h-9 font-semibold text-link min-h-11 inline-flex items-center lms-inline-link hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>} />
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
  return <div className="min-w-0 space-y-4">
    <PageHeader title={COLLEGE_LEGACY_PAGE_TITLES.peopleDirectory}
      description="Manage college memberships, roles and lifecycle. For the read-only legacy contact tabs, open Contacts."
      actions={<PersonOnboardDialog collegeId={membership.collegeId} />} />
    <details className="min-w-0 border-b border-border pb-3">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Other people actions</summary>
      <nav aria-label="People directory tools" className="flex min-w-0 flex-wrap items-center gap-3 pt-2">
        {process.env.COLLEGE_STUDY_GROUPS_RELEASED === "true" ? <Link href="/college/groups"
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Student groups</Link> : null}<Link href="/college/contacts" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Browse contacts</Link><Link href={collegePeopleExportHref(filter)} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Export filtered CSV</Link>
      </nav>
    </details>
    <section className="min-w-0" aria-label="People filters">
      <form action="/college/people/manage" method="get" role="search" className="grid min-w-0 grid-cols-1 items-end gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 md:grid-cols-2 min-[992px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]" aria-label="Search people">
        <label className="grid min-w-0 w-full flex-1 md:w-auto md:min-w-44 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name, email or phone
          <Input name="q" type="search" maxLength={100} defaultValue={filter.q}
            />
        </label>
        <label className="grid min-w-0 w-full gap-[6px] md:w-auto md:min-w-36 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Role
          <Select name="role" defaultValue={filter.role}
           >
            <option value="ALL">All roles</option>
            <option value="LEARNER">Learner</option>
            <option value="FACULTY">Faculty</option>
            <option value="COLLEGE_ADMIN">College Admin</option>
            <option value="MENTOR">Mentor</option>
            <option value="TPO">TPO</option>
          </Select>
        </label>
        <label className="grid min-w-0 w-full gap-[6px] md:w-auto md:min-w-36 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Membership
          <Select name="status" defaultValue={filter.status}
           >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="ENDED">Ended</option>
          </Select>
        </label>
        <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Apply</Button>
        <Link href="/college/people/manage" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear</Link>
      </form>
    </section>
    <section className="space-y-2" aria-label="Filtered people">
      {filter.role==="LEARNER"?<p role="status" className="text-sm text-[var(--lms-muted-text)]">Learners retrieved</p>:null}
      <p className="text-sm text-muted-foreground">{pagination.total} matching membership{pagination.total === 1 ? "" : "s"}</p>
      <DataTable caption="College memberships" columns={columns} rows={people.items}
        getRowKey={person => person.membership.id}
        empty={<EmptyState title="No memberships"
          description={collegePeopleHasFilters(filter)
            ? "No memberships match the selected People filters."
            : "No memberships are recorded in this college yet."}
          action={collegePeopleHasFilters(filter)?<Link href="/college/people/manage"
            className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear People filters</Link>:undefined}/>} />
    </section>
    <nav aria-label="People directory pages" className="flex min-w-0 flex-col items-stretch gap-3 text-sm md:flex-row md:items-center md:justify-between">
      <span className="text-muted-foreground">
        Page {pagination.page} of {pagination.pages} · {pagination.first}–{pagination.last} of {pagination.total}
      </span>
      <div className="flex flex-wrap gap-3">
        {pagination.hasPrevious ? <Link href={collegePeopleManageHref({ ...filter, page: filter.page - 1 })}
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Previous</Link> : null}
        {pagination.hasNext ? <Link href={collegePeopleManageHref({ ...filter, page: filter.page + 1 })}
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Next</Link> : null}
      </div>
    </nav>
    <p className="text-xs text-muted-foreground">The CSV includes at most 1,000 matching memberships and visibly discloses truncation. Roles are membership grants, not separate people. A multi-role person may appear under multiple role filters. Profile and lifecycle actions are governed by existing permissions.</p>
  </div>;
}
