import { FilterBar } from "@/components/ui/filter-bar";
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
import { Disclosure } from "@/components/ui/disclosure";
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
    <PageHeader title="Organizations"/>
    <ErrorState title="Invalid organization directory filters"
      description="Search text must be 100 characters or less; choose a valid page and page size. Remove repeated or unsupported filters."
      action={<Link href="/admin/organizations" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link>}/>
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
        title="Organizations"
        description="Platform organizations are constrained by the selected Super Admin safety scope."
      />
      {canCreate ? <section aria-label="Create New Organization">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Create New Organization</h2>
        <OrganizationCreateForm />
      </section> : null}
      <h2 className="text-[var(--lms-font-lg)] font-semibold text-[var(--lms-heading)]">Existing Organizations</h2>
      {canCreate?<Disclosure title={`Archived organizations · ${archived.length} shown`} className="border-t border-border pt-4">
       <p className="mt-2 text-xs text-muted-foreground">Restoring an organization does not restore archived colleges. Only the first 200 records in your safety scope are shown.</p>
       <ul className="mt-3 divide-y divide-border border-y border-border">
        {archived.map(organization=><li key={organization.id}
         className="flex flex-wrap items-center justify-between gap-3 py-3">
         <span className="break-words text-sm font-semibold text-foreground">{organization.name}</span>
         <TenantRestoreAction kind="organization" id={organization.id} name={organization.name}/>
        </li>)}
       </ul>
       {!archived.length?<EmptyState title="No archived organizations" description="No archived organizations in this scope."/>:null}
      </Disclosure>:null}
      <FilterBar title="Organization filters"><form method="get" className="flex min-w-0 flex-wrap items-end gap-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)] max-[767px]:[&_label]:w-full">
       <label className="flex min-w-0 w-full flex-1 flex-col gap-[var(--lms-space-1)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] md:min-w-48">Search organizations
        <Input name="q" defaultValue={q} maxLength={100} placeholder="Search organizations"
         className="w-full" />
       </label>
       <label className="flex flex-col gap-[var(--lms-space-1)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rows per page
        <Select name="pageSize" defaultValue={String(pageSize)} className="w-full">
         {[10,25,50,100].map(size=><option key={size} value={size}>{size}</option>)}
        </Select>
       </label>
       <Button type="submit" className="min-h-11 md:min-h-9">Search</Button>
       <Link href="/admin/organizations" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear search</Link>
       <Link href={href(page)} className="inline-flex min-h-11 md:min-h-9 items-center text-sm text-primary-text underline">Refresh</Link>
      </form></FilterBar>
      <p role="status" className="text-sm text-body">{q?matching.length+" of "+organizations.length:organizations.length} organizations · Page {page} of {totalPages}</p>
      <DataTable caption="Existing Organizations" empty={<EmptyState
        title={q?"No organizations match your search":"No organizations in this scope"}
        description={q?"No active organizations match this search in the selected Super Admin safety scope. Clear the search or select another authorized scope.":"There are no active organizations visible under the current Super Admin safety scope. Create one only when your role and scope permit it."}/>}
        columns={columns} rows={visible} getRowKey={organization=>organization.id}/>
      <Pagination label="Organization pages" page={page} pageCount={totalPages} hrefForPage={href}/>
    </div>
  );
}
