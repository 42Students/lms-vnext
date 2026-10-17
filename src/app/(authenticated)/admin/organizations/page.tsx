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
import { EmptyState } from "@/components/ui/empty-state";
import { can } from "@/modules/permissions/policy";
import { listOrganizations,listArchivedOrganizations } from "@/modules/organizations/service";

type OrganizationRow = Awaited<
  ReturnType<typeof listOrganizations>
>[number];

export default async function OrganizationsPage({searchParams}:{searchParams:Promise<{q?:string|string[];page?:string|string[];pageSize?:string|string[]}>}) {
  const context = await getCurrentRequestContext();
  const organizations = await listOrganizations(context);
  const raw=await searchParams;
  const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
  const q=(first(raw.q)??"").trim().slice(0,100);
  const requestedSize=Number(first(raw.pageSize)??25);
  const pageSize=[10,25,50,100].includes(requestedSize)?requestedSize:25;
  const matching=organizations.filter(item=>item.name.toLocaleLowerCase("en-IN").includes(q.toLocaleLowerCase("en-IN")));
  const totalPages=Math.max(1,Math.ceil(matching.length/pageSize));
  const requestedPage=Number(first(raw.page)??1);
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
      {canCreate ? <section aria-label="Create New Organization">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Create New Organization</h2>
        <OrganizationCreateForm />
      </section> : null}
      <h2 className="text-lg font-semibold text-foreground">Existing Organizations</h2>
      {canCreate?<details className="rounded-xl border border-border bg-surface p-4">
       <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-foreground">
        Archived organizations · {archived.length} shown
       </summary>
       <p className="mt-2 text-xs text-muted-foreground">Restoring an organization does not restore archived colleges. Only the first 200 records in your safety scope are shown.</p>
       <ul className="mt-3 grid gap-2">
        {archived.map(organization=><li key={organization.id}
         className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
         <span className="break-words text-sm font-semibold text-foreground">{organization.name}</span>
         <TenantRestoreAction kind="organization" id={organization.id} name={organization.name}/>
        </li>)}
       </ul>
       {!archived.length?<p role="status" className="mt-3 text-sm text-body">No archived organizations in this scope.</p>:null}
      </details>:null}
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
       <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm font-semibold text-body">Search organizations
        <input name="q" defaultValue={q} maxLength={100} placeholder="Search organizations"
         className="min-h-11 rounded border border-border bg-surface px-3 text-foreground" />
       </label>
       <label className="flex flex-col gap-1 text-sm font-semibold text-body">Rows per page
        <select name="pageSize" defaultValue={String(pageSize)} className="min-h-11 rounded border border-border bg-surface px-3">
         {[10,25,50,100].map(size=><option key={size} value={size}>{size}</option>)}
        </select>
       </label>
       <button className="min-h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary">Search</button>
       <Link href="/admin/organizations" className="inline-flex min-h-11 items-center text-sm text-primary-text underline">Clear search</Link>
       <Link href={href(page)} className="inline-flex min-h-11 items-center text-sm text-primary-text underline">Refresh</Link>
      </form>
      <p role="status" className="text-sm text-body">{q?matching.length+" of "+organizations.length:organizations.length} organizations · Page {page} of {totalPages}</p>
      {organizations.length===0 ? <EmptyState title="No organizations in this scope" description="There are no active organizations visible under the current Super Admin safety scope. Create one only when your role and scope permit it."/> : null}
      <div className="grid min-w-0 gap-3 lg:hidden" aria-label="Organization cards">
        {visible.map((organization) => (
          <article key={organization.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
            <h2 className="break-words text-base font-semibold text-foreground">{organization.name}</h2>
            <p className="mt-2 text-xs text-muted-foreground">Created {organization.createdAt.toISOString().slice(0,10)}</p>
            {can(context,"organization.manage",{organizationId:organization.id}) ?
              <div className="mt-3 flex flex-wrap"><OrganizationActions organizationId={organization.id} name={organization.name}/></div> : null}
          </article>
        ))}
      </div>
      <div className="hidden min-w-0 lg:block">
        <DataTable columns={columns} rows={visible} getRowKey={(organization)=>organization.id}/>
      </div>
      <nav aria-label="Organization pages" className="flex flex-wrap gap-3 text-sm">
       {page>1?<Link href={href(page-1)} className="min-h-10 rounded border border-border px-3 py-2">Previous</Link>:null}
       {page<totalPages?<Link href={href(page+1)} className="min-h-10 rounded border border-border px-3 py-2">Next</Link>:null}
      </nav>
    </div>
  );
}
