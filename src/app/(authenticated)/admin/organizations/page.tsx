import { getCurrentRequestContext } from "@/auth/request-context";
import { OrganizationActions } from "@/components/admin/organization-actions";
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

export default async function OrganizationsPage() {
  const context = await getCurrentRequestContext();
  const organizations = await listOrganizations(context);
  const canCreate = can(
    context,
    "organization.manage",
  );

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
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (organization) =>
        can(context, "organization.manage", {
          organizationId: organization.id,
        }) ? (
          <OrganizationActions
            organizationId={organization.id}
            name={organization.name}
          />
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Organizations"
        description="Platform organizations are constrained by the selected Super Admin safety scope."
      />
      {canCreate ? <OrganizationCreateForm /> : null}
      <div className="grid min-w-0 gap-3 lg:hidden" aria-label="Organization cards">
        {organizations.map((organization) => (
          <article key={organization.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
            <h2 className="break-words text-base font-semibold text-foreground">{organization.name}</h2>
            <p className="mt-2 text-xs text-muted-foreground">Created {organization.createdAt.toISOString().slice(0,10)}</p>
            {can(context,"organization.manage",{organizationId:organization.id}) ?
              <div className="mt-3 flex flex-wrap"><OrganizationActions organizationId={organization.id} name={organization.name}/></div> : null}
          </article>
        ))}
      </div>
      <div className="hidden min-w-0 lg:block">
        <DataTable columns={columns} rows={organizations} getRowKey={(organization)=>organization.id}/>
      </div>
    </div>
  );
}
