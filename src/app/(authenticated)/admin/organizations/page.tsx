import { getCurrentRequestContext } from "@/auth/request-context";
import { OrganizationCreateForm } from "@/components/admin/organization-create-form";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { can } from "@/modules/permissions/policy";
import { listOrganizations } from "@/modules/organizations/service";

type OrganizationRow = Awaited<
  ReturnType<typeof listOrganizations>
>[number];

const columns: DataTableColumn<OrganizationRow>[] = [
  {
    key: "name",
    header: "Organization",
    cell: (organization) => (
      <span className="font-semibold text-foreground">
        {organization.name}
      </span>
    ),
  },
  {
    key: "created",
    header: "Created",
    cell: (organization) =>
      organization.createdAt.toISOString().slice(0, 10),
  },
];

export default async function OrganizationsPage() {
  const context = await getCurrentRequestContext();
  const organizations = await listOrganizations(context);
  const canCreate = can(
    context,
    "organization.manage",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Organizations"
        description="Platform organizations are constrained by the selected Super Admin safety scope."
      />
      {canCreate ? <OrganizationCreateForm /> : null}
      <DataTable
        columns={columns}
        rows={organizations}
        getRowKey={(organization) => organization.id}
      />
    </div>
  );
}
