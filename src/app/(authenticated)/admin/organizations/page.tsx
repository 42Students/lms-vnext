import { getCurrentRequestContext } from "@/auth/request-context";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Organizations"
        description="Platform-level organizations available to the current Super Admin scope."
      />
      <DataTable
        columns={columns}
        rows={organizations}
        getRowKey={(organization) => organization.id}
      />
    </div>
  );
}
