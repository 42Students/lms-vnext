import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeCreateForm } from "@/components/admin/college-create-form";
import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { can } from "@/modules/permissions/policy";
import { listColleges } from "@/modules/colleges/service";
import { listOrganizations } from "@/modules/organizations/service";

type CollegeRow = Awaited<ReturnType<typeof listColleges>>[number];

const columns: DataTableColumn<CollegeRow>[] = [
  {
    key: "college",
    header: "College",
    cell: (college) => (
      <div>
        <p className="m-0 font-semibold text-foreground">
          {college.name}
        </p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {college.code}
        </p>
      </div>
    ),
  },
  {
    key: "location",
    header: "Location",
    cell: (college) =>
      [college.city, college.state, college.country]
        .filter(Boolean)
        .join(", ") || "—",
  },
  {
    key: "created",
    header: "Created",
    cell: (college) =>
      college.createdAt.toISOString().slice(0, 10),
  },
  {
    key: "actions",
    header: <span className="sr-only">Actions</span>,
    className: "text-right",
    cell: (college) => (
      <CollegeEditDialog college={college} />
    ),
  },
];

export default async function CollegesPage() {
  const context = await getCurrentRequestContext();
  const [colleges, organizations] = await Promise.all([
    listColleges(context),
    listOrganizations(context),
  ]);
  const creatableOrganizations = organizations.filter(
    (organization) =>
      can(context, "college.manage", {
        organizationId: organization.id,
      }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Colleges"
        description="Active colleges are constrained by the selected Super Admin safety scope."
      />
      {creatableOrganizations.length > 0 ? (
        <CollegeCreateForm
          organizations={creatableOrganizations.map(
            (organization) => ({
              id: organization.id,
              name: organization.name,
            }),
          )}
        />
      ) : organizations.length === 0 ? (
        <EmptyState
          title="Create an organization first"
          description="Every college belongs to an organization, so the organization is the required first tenant boundary."
        />
      ) : null}
      <DataTable
        columns={columns}
        rows={colleges}
        getRowKey={(college) => college.id}
      />
    </div>
  );
}
