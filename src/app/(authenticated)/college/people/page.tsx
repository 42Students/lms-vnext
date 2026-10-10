import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PersonMembershipActions } from "@/components/admin/person-membership-actions";
import { PersonOnboardDialog } from "@/components/admin/person-onboard-dialog";
import { PeoplePagination } from "@/components/admin/people-pagination";
import { parsePeoplePage, peoplePageState, PEOPLE_PAGE_SIZE } from "@/modules/admin-ui/people-pagination";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listCollegePeopleWithRuntime,
} from "@/modules/people/runtime";
import type { PersonMembershipView } from "@/modules/people/service";

const columns: DataTableColumn<PersonMembershipView>[] = [
  {
    key: "person",
    header: "Person",
    cell: (person) => (
      <div>
        <p className="m-0 font-semibold text-foreground">
          {person.user.displayName || "Unnamed person"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {person.user.email || person.user.phoneE164 || "No contact detail"}
        </p>
      </div>
    ),
  },
  {
    key: "roles",
    header: "Roles",
    cell: (person) => person.membership.roles.join(", ") || "—",
  },
  {
    key: "status",
    header: "Status",
    cell: (person) => (
      <StatusBadge
        tone={
          person.membership.status === "ACTIVE"
            ? "success"
            : person.membership.status === "SUSPENDED"
              ? "warning"
              : "neutral"
        }
      >
        {person.membership.status}
      </StatusBadge>
    ),
  },
  {
    key: "actions",
    header: <span className="sr-only">Actions</span>,
    className: "text-right",
    cell: (person) => (
      <PersonMembershipActions
        membershipId={person.membership.id}
        collegeId={person.membership.collegeId}
        displayName={person.user.displayName || "Person"}
        roles={person.membership.roles}
        status={person.membership.status}
      />
    ),
  },
];

export default async function CollegePeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requestedPage = parsePeoplePage(pageParam);
  const context = await getCurrentRequestContext();
  const membership = context.membership;

  if (!membership) {
    redirect("/dashboard");
  }

  const people = await listCollegePeopleWithRuntime(context, {
    collegeId: membership.collegeId,
    limit: PEOPLE_PAGE_SIZE,
    offset: (requestedPage - 1) * PEOPLE_PAGE_SIZE,
  });

  const pagination = peoplePageState(requestedPage, people.pagination.total);
  if (requestedPage !== pagination.page) {
    redirect("/college/people" +
      (pagination.page === 1 ? "" : `?page=${pagination.page}`));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="People"
        description="Canonical users and membership roles for your college."
        actions={
          <PersonOnboardDialog
            collegeId={membership.collegeId}
          />
        }
      />
      <DataTable
        columns={columns}
        rows={people.items}
        getRowKey={(person) => person.membership.id}
      />
      <PeoplePagination
        basePath="/college/people"
        page={pagination.page}
        pageSize={PEOPLE_PAGE_SIZE}
        total={pagination.total}
      />
    </div>
  );
}
