import { getCurrentRequestContext } from "@/auth/request-context";
import { PersonMembershipActions } from "@/components/admin/person-membership-actions";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
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
          {person.user.email ||
            person.user.phoneE164 ||
            "No contact detail"}
        </p>
      </div>
    ),
  },
  {
    key: "roles",
    header: "Roles",
    cell: (person) =>
      person.membership.roles.join(", ") || "—",
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
        displayName={person.user.displayName || "Person"}
        roles={person.membership.roles}
        status={person.membership.status}
      />
    ),
  },
];

export default async function SuperAdminPeoplePage() {
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="People"
          description="People administration requires a college safety scope."
        />
        <EmptyState
          title="Select a college scope"
          description="Use the Super Admin scope selector in the top bar to choose a college before viewing membership data."
        />
      </div>
    );
  }

  const people = await listCollegePeopleWithRuntime(context, {
    collegeId,
    limit: 100,
    offset: 0,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="People"
        description="Canonical people and memberships inside the selected college safety scope."
      />
      <DataTable
        columns={columns}
        rows={people.items}
        getRowKey={(person) => person.membership.id}
      />
    </div>
  );
}
