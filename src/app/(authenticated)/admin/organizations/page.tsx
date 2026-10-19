import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { OrganizationActions } from "@/components/admin/organization-actions";
import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
import { OrganizationCreateForm } from "@/components/admin/organization-create-form";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { parseAdminDirectorySearchParams } from "@/modules/colleges/admin-directory-query-model";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { can, requirePermission } from "@/modules/permissions/policy";
import { listOrganizations,listArchivedOrganizations } from "@/modules/organizations/service";
import {organizationCreatedIstDate} from "@/modules/organizations/organization-created-date-model";

type OrganizationRow = Awaited<
  ReturnType<typeof listOrganizations>
>[number];

export default async function OrganizationsPage({searchParams}:{searchParams:Promise<{q?:string|string[];page?:string|string[];pageSize?:string|string[]}>}) {
  const context = await getCurrentRequestContext();
  requirePermission(context, "admin-scope.select");
  const filters=parseAdminDirectorySearchParams(await searchParams);
  if (!filters) return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="Super Admin" title="Organizations"/>
    <ErrorState title="Invalid organization directory filters"
      description="Search text must be 100 characters or less; choose a valid page and page size. Remove repeated or unsupported filters."
      action={<Link href="/admin/organizations" className="inline-flex min-h-[var(--lms-control-height)] items-center font-semibold underline">Clear filters</Link>}/>
  </div>;
  const organizations = await listOrganizations(context);
  const {q,pageSize}=filters;
  const matching=organizations.filter(item=>item.name.toLocaleLowerCase("en-IN").includes(q.toLocaleLowerCase("en-IN")));
  const totalPages=Math.max(1,Math.ceil(matching.length/pageSize));
  const requestedPage=filters.page;
  const page=Number.isSafeInteger(requestedPage)?Math.min(Math.max(1,requestedPage),totalPages):1;
  const visible=matching.slice((page-1)*pageSize,page*pageSize);
  const href=(nextPage:number)=>"/admin/organizations?"+new URLSearchParams({
    ...(q?{q}:{}),pageSize:String(pageSize),page:String(nextPage),
  }).toString();
  const canCreate = can(
    context,
    "organization.manage",
  );
  const archived=canCreate?await listArchivedOrganizations(context):[];

  const columns: DataTableColumn<OrganizationRow>[] = [
    {
      key: "name",
      header: "Name",
      mobilePriority: "primary",
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
        organizationCreatedIstDate(organization.createdAt),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      mobilePriority: "action",
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
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Organizations"
        description="Platform organizations are constrained by the selected Super Admin safety scope."
      />
      {canCreate ? <section aria-label="Create New Organization">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Create New Organization</h2>
        <OrganizationCreateForm />
      </section> : null}
      <h2 className="text-lg font-semibold text-foreground">Existing Organizations</h2>
      {canCreate?<details className="border-t border-border pt-4">
       <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-foreground">
        Archived organizations · {archived.length} shown
       </summary>
       <p className="mt-2 text-xs text-muted-foreground">Restoring an organization does not restore archived colleges. Only the first 200 records in your safety scope are shown.</p>
       <ul className="mt-3 divide-y divide-border border-y border-border">
        {archived.map(organization=><li key={organization.id}
         className="flex flex-wrap items-center justify-between gap-3 py-3">
         <span className="break-words text-sm font-semibold text-foreground">{organization.name}</span>
         <TenantRestoreAction kind="organization" id={organization.id} name={organization.name}/>
        </li>)}
       </ul>
       {!archived.length?<p role="status" className="mt-3 text-sm text-body">No archived organizations in this scope.</p>:null}
      </details>:null}
      <form method="get" className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
       <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm font-semibold text-body">Search organizations
        <Input name="q" defaultValue={q} maxLength={100} placeholder="Search organizations"
         className="w-full" />
       </label>
       <label className="flex flex-col gap-1 text-sm font-semibold text-body">Rows per page
        <Select name="pageSize" defaultValue={String(pageSize)} className="w-full">
         {[10,25,50,100].map(size=><option key={size} value={size}>{size}</option>)}
        </Select>
       </label>
       <Button type="submit">Search</Button>
       <Link href="/admin/organizations" className="inline-flex min-h-[var(--lms-control-height)] items-center text-sm text-primary-text underline">Clear search</Link>
       <Link href={href(page)} className="inline-flex min-h-[var(--lms-control-height)] items-center text-sm text-primary-text underline">Refresh</Link>
      </form>
      <p role="status" className="text-sm text-body">{q?matching.length+" of "+organizations.length:organizations.length} organizations · Page {page} of {totalPages}</p>
      {organizations.length===0 ? <EmptyState title="No organizations in this scope" description="There are no active organizations visible under the current Super Admin safety scope. Create one only when your role and scope permit it."/> : null}
      <DataTable caption="Existing Organizations" empty={<p className="m-0 text-sm text-muted-foreground">No records to show.</p>}
        columns={columns} rows={visible} getRowKey={organization=>organization.id}/>
      <Pagination label="Organization pages" page={page} pageCount={totalPages} hrefForPage={href}/>
    </div>
  );
}
