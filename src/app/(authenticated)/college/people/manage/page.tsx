import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import { Alert } from "@/components/ui/alert";
import { getDb } from "@/db/client";
import { countDistinct, eq, and } from "drizzle-orm";
import { departments,programs,sections,cohorts,collegeMemberships,membershipRoles } from "@/db/schema";
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
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";

import { env } from "@/config/env";
import { ROLE } from "@/modules/identity/roles";
type Search = Record<string, string | string[] | undefined>;
function collegePeopleManageHref(filter: CollegePeopleDirectoryFilter) {
  return collegePeopleDirectoryHref(filter).replace("/college/people", "/college/people/manage");
}

function personLabel(person:PersonMembershipView){
 const name=person.user.displayName?.trim();
 if(name)return name;
 const contact=person.user.email?.split("@")[0]?.trim()||person.user.phoneE164?.trim();
 return contact||"Person "+person.membership.id.slice(0,8);
}
const columns: DataTableColumn<PersonMembershipView>[] = [
  { key: "person", header: "Person", mobilePriority: "primary", mobileLabel: "Person", cell: person => (
    <div className="min-w-32">
      <p className="m-0 font-semibold text-foreground">{personLabel(person)}</p>
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
        displayName={personLabel(person)}
        roles={person.membership.roles} status={person.membership.status} />
    ) },
];

export default async function CollegePeoplePage({ searchParams }: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, ROLE.COLLEGE_ADMIN)) redirect("/dashboard");
  const raw = await searchParams;
  let filter:CollegePeopleDirectoryFilter|null=null;
  try{filter=parseCollegePeopleDirectorySearchParams(raw);}catch{filter=null;}

  if (!filter) {
    return <div className="min-w-0 space-y-5">
      <PageHeader title={COLLEGE_LEGACY_PAGE_TITLES.peopleDirectory} />
      <ErrorState title="Invalid directory filters"
        description="Check the search, role, status or page. No people were loaded."
        action={<TextLink href="/college/people/manage" className="md:min-h-9 min-h-11 inline-flex items-center">Clear filters</TextLink>} />
    </div>;
  }
  const people = await listCollegePeopleWithRuntime(context, {
    collegeId: membership.collegeId,
    limit: PEOPLE_PAGE_SIZE, offset: (filter.page - 1) * PEOPLE_PAGE_SIZE,
    q: filter.q, role: filter.role, status: filter.status,
  });
  const pagination = peoplePageState(filter.page, people.pagination.total);
  // The legacy learner picker returned 15 suggestions for a blank query.
  // Keep this separate from the 50-row administrative membership directory.
  const showLearnerSearch=filter.role===ROLE.LEARNER;
  const suggestionsResult=showLearnerSearch?await Promise.allSettled([
   listCollegePeopleWithRuntime(context,{
    collegeId:membership.collegeId,limit:15,offset:0,q:filter.q,
    role:"LEARNER",status:"ACTIVE",
   }),
   getDb().select({count:countDistinct(collegeMemberships.id)})
    .from(collegeMemberships).innerJoin(membershipRoles,
     eq(membershipRoles.membershipId,collegeMemberships.id))
    .where(and(eq(collegeMemberships.collegeId,membership.collegeId),
     eq(membershipRoles.role,"LEARNER"))),
   getDb().select({count:countDistinct(departments.id)})
    .from(departments).where(eq(departments.collegeId,membership.collegeId)),
   getDb().select({count:countDistinct(programs.id)})
    .from(programs).innerJoin(departments,eq(departments.id,programs.departmentId))
    .where(eq(departments.collegeId,membership.collegeId)),
   getDb().select({count:countDistinct(sections.id)})
    .from(sections).innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
    .innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,eq(departments.id,programs.departmentId))
    .where(eq(departments.collegeId,membership.collegeId)),
  ]):null;
  const suggestions=suggestionsResult?.[0].status==="fulfilled"
   ?suggestionsResult[0].value.items:[];
  const snapshot=suggestionsResult?[
   {label:"Learners",value:suggestionsResult[1].status==="fulfilled"
    ?suggestionsResult[1].value[0]?.count??0:"Unavailable"},
   {label:"Departments",value:suggestionsResult[2].status==="fulfilled"
    ?suggestionsResult[2].value[0]?.count??0:"Unavailable"},
   {label:"Colleges",value:1},
   {label:"Programs",value:suggestionsResult[3].status==="fulfilled"
    ?suggestionsResult[3].value[0]?.count??0:"Unavailable"},
   {label:"Classes",value:suggestionsResult[4].status==="fulfilled"
    ?suggestionsResult[4].value[0]?.count??0:"Unavailable"},
  ]:null;
  if (filter.page !== pagination.page) {
    redirect(collegePeopleManageHref({ ...filter, page: pagination.page }));
  }
  return <div className="min-w-0 space-y-4">
    <PageHeader title={COLLEGE_LEGACY_PAGE_TITLES.peopleDirectory}
      description="Manage college memberships, roles and lifecycle. For the read-only legacy contact tabs, open Contacts."
      actions={<PersonOnboardDialog collegeId={membership.collegeId} />} />
    <Disclosure title="Other people actions" className="min-w-0">
      <nav aria-label="People directory tools" className="flex min-w-0 flex-wrap items-center gap-3 pt-2">
        {env.COLLEGE_STUDY_GROUPS_RELEASED === "true" ? <TextLink href="/college/groups"
        className="inline-flex min-h-11 items-center md:min-h-9">Student groups</TextLink> : null}<TextLink href="/college/contacts" className="inline-flex min-h-11 items-center md:min-h-9">Browse contacts</TextLink><TextLink href={collegePeopleExportHref(filter)} className="inline-flex min-h-11 items-center md:min-h-9">Export filtered CSV</TextLink>
      </nav>
    </Disclosure>
    <section className="min-w-0" aria-label="People filters">
      <form action="/college/people/manage" method="get" role="search" className="grid min-w-0 grid-cols-1 items-end gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]" aria-label="Search people">
        <Label stack className="min-w-0 w-full flex-1 md:w-auto md:min-w-44">Name, email or phone
          <Input name="q" type="search" maxLength={100} defaultValue={filter.q}
            />
        </Label>
        <Label stack className="min-w-0 w-full md:w-auto md:min-w-36">Role
          <Select name="role" defaultValue={filter.role}
           >
            <option value="ALL">All roles</option>
            <option value="LEARNER">Learner</option>
            <option value="FACULTY">Faculty</option>
            <option value="COLLEGE_ADMIN">College Admin</option>
            <option value="MENTOR">Mentor</option>
            <option value="TPO">TPO</option>
          </Select>
        </Label>
        <Label stack className="min-w-0 w-full md:w-auto md:min-w-36">Membership
          <Select name="status" defaultValue={filter.status}
           >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="ENDED">Ended</option>
          </Select>
        </Label>
        <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Apply</Button>
        <TextLink href="/college/people/manage" className="inline-flex min-h-11 items-center md:min-h-9">Clear</TextLink>
      </form>
    </section>
    {showLearnerSearch?<section aria-label="Learner search" className="min-w-0 space-y-3">
     <Heading level={2} size="base" className="text-foreground">Learner search</Heading>
     {snapshot?<div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-5">
      {snapshot.map(tile=><StatTile key={tile.label} label={tile.label} value={tile.value}/>)}
     </div>:null}
     {suggestionsResult?.some(item=>item.status==="rejected")?
      <Alert tone="warning">Some learner search statistics couldn't be loaded. The college membership directory is still available.</Alert>:
      <p role="status" className="text-xs text-muted-foreground">Stats retrieved.</p>}
     <div className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-3">
      <Heading level={3} size="sm" className="text-foreground">
       {filter.q?"Matching learner suggestions":"First 15 learners"}
      </Heading>
      <p className="mt-1 text-xs text-muted-foreground">
       Scoped to the selected college. Choosing a suggestion filters the directory;
       it does not imply a popularity ranking or grant new access.
      </p>
      {suggestions.length?<ul className="mt-2 divide-y divide-border">
       {suggestions.map(person=><li key={person.membership.id}
        className="flex min-w-0 flex-wrap items-center justify-between gap-2 py-2">
        <span className="min-w-0 break-words text-sm">{personLabel(person)}</span>
        <TextLink href={collegePeopleManageHref({...filter,q:person.user.displayName?.trim()||
         person.user.email||person.user.phoneE164||"",page:1})}
         className="inline-flex min-h-11 items-center md:min-h-9">
         Select
        </TextLink>
       </li>)}
      </ul>:<p className="mt-2 text-sm text-muted-foreground">No learners found.</p>}
     </div>
    </section>:null}
    <section className="space-y-2" aria-label="Filtered people">
      {filter.role===ROLE.LEARNER?<p role="status" className="text-sm text-[var(--lms-muted-text)]">Learners retrieved</p>:null}
      <p className="text-sm text-muted-foreground">{pagination.total} matching membership{pagination.total === 1 ? "" : "s"}</p>
      <DataTable caption="College memberships" columns={columns} rows={people.items}
        getRowKey={person => person.membership.id}
        empty={<EmptyState title="No memberships"
          description={collegePeopleHasFilters(filter)
            ? "No memberships match the selected People filters."
            : "No memberships are recorded in this college yet."}
          action={collegePeopleHasFilters(filter)?<TextLink href="/college/people/manage"
            className="inline-flex min-h-11 items-center md:min-h-9">Clear People filters</TextLink>:undefined}/>} />
    </section>
    <nav aria-label="People directory pages" className="flex min-w-0 flex-col items-stretch gap-3 text-sm md:flex-row md:items-center md:justify-between">
      <span className="text-muted-foreground">
        Page {pagination.page} of {pagination.pages} · {pagination.first}–{pagination.last} of {pagination.total}
      </span>
      <div className="flex flex-wrap gap-3">
        {pagination.hasPrevious ? <TextLink href={collegePeopleManageHref({ ...filter, page: filter.page - 1 })}
          className="inline-flex min-h-11 items-center md:min-h-9">Previous</TextLink> : null}
        {pagination.hasNext ? <TextLink href={collegePeopleManageHref({ ...filter, page: filter.page + 1 })}
          className="inline-flex min-h-11 items-center md:min-h-9">Next</TextLink> : null}
      </div>
    </nav>
    <p className="text-xs text-muted-foreground">The CSV includes at most 1,000 matching memberships and visibly discloses truncation. Roles are membership grants, not separate people. A multi-role person may appear under multiple role filters. Profile and lifecycle actions are governed by existing permissions.</p>
  </div>;
}
