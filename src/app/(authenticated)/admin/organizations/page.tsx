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
import {StatusBadge} from "@/components/ui/status-badge";
import {OrganizationDirectoryRefresh} from "@/components/admin/organization-directory-refresh";
import {RECOVERY_ENTITY_TYPES,isRecoveryEntityType} from "@/modules/admin-ui/recovery-type-registry";
import { can, requirePermission } from "@/modules/permissions/policy";
import { listOrganizations,listArchivedOrganizations } from "@/modules/organizations/service";
import {organizationCreatedIstDate} from "@/modules/organizations/organization-created-date-model";

type OrganizationRow = Awaited<
  ReturnType<typeof listOrganizations>
>[number];

export default async function OrganizationsPage({searchParams}:{searchParams:Promise<{q?:string|string[];page?:string|string[];pageSize?:string|string[];type?:string|string[]}>}) {
  const context = await getCurrentRequestContext();
  requirePermission(context, "admin-scope.select");
  const raw=await searchParams;
  const filters=parseAdminDirectorySearchParams({q:raw.q,page:raw.page,pageSize:raw.pageSize});
  const selectedRestoreType=raw.type??"organization";
  if(!isRecoveryEntityType(selectedRestoreType))return <div className="min-w-0 space-y-4">
    <PageHeader title="Deleted Items"/>
    <ErrorState title="Invalid deleted item type" description="Choose one of the supported entity types from the recovery directory."
      action={<Link href="/admin/organizations?type=organization" className="font-semibold text-link underline">Clear type filter</Link>}/>
  </div>;
  if (!filters) return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Organizations"/>
    <ErrorState title="Invalid organization directory filters"
      description="Search text must be 100 characters or less; choose a valid page and page size. Remove repeated or unsupported filters."
      action={<Link href="/admin/organizations" className="inline-flex min-h-11 w-full items-center justify-center font-[650] text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>}/>
  </div>;
  const organizations = await listOrganizations(context).catch(()=>null);
  if(!organizations)return <div className="min-w-0 space-y-4">
    <PageHeader title="Organizations"/>
    <ErrorState title="Unable to load organizations"
      description="The organization directory could not be loaded. No data from a previous safety scope is displayed."
      action={<Link href="/admin/organizations" className="font-semibold text-link underline">Retry</Link>}/>
  </div>;
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
  const canCreateGlobal=canCreate&&!context.adminScope?.collegeId&&!context.adminScope?.organizationId;
  const archiveResponse=canCreate
    ?await listArchivedOrganizations(context).then(value=>({ok:true as const,value}))
      .catch(()=>({ok:false as const,value:[]}))
    :{ok:true as const,value:[]};
  const archived=archiveResponse.value;

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
      key: "status",header:"Status",mobilePriority:"secondary",className:"w-[100px]",
      cell:()=> <StatusBadge tone="success">Active</StatusBadge>,
    },
    {
      key: "actions",
      header: "Actions",
      mobilePriority: "action",
      className: "min-w-[210px] text-right",
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
    <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader
        title="Organizations"
        description="Platform organizations are constrained by the selected Super Admin safety scope."
      />
      <div className={"grid min-w-0 grid-cols-1 items-start gap-6 "+(canCreateGlobal?"lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)]":"")}>
        {canCreate&&!canCreateGlobal?<p role="status" className="text-sm text-muted-foreground">
          Clear scope to manage organizations. Creating a platform organization requires the global Super Admin scope.
        </p>:null}
        {canCreateGlobal?<section aria-label="Create New Organization"
          className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 shadow-sm">
          <h2 className="-mx-4 border-b border-border px-4 pb-4 text-base font-semibold text-[var(--lms-heading)]">Create New Organization</h2>
          <OrganizationCreateForm/>
        </section>:null}
        <section aria-label="Existing Organizations" className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 shadow-sm">
          <div className="-mx-4 flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 pb-4">
            <h2 className="text-base font-semibold text-[var(--lms-heading)]">Existing Organizations</h2>
            <div className="flex flex-wrap items-center gap-2">
              <form method="get" role="search" aria-label="Search organizations" className="flex flex-wrap items-center gap-2">
                <label htmlFor="organization-search" className="sr-only">Search organizations</label>
                <Input id="organization-search" type="search" name="q" defaultValue={q}
                  maxLength={100} placeholder="Search organizations" className="min-h-11 w-full sm:w-[200px] md:min-h-9"/>
                <input type="hidden" name="pageSize" value={pageSize}/>
                <Button type="submit" variant="secondary" size="sm">Search</Button>
                {q?<Link href={"/admin/organizations?pageSize="+pageSize} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">Clear</Link>:null}
              </form>
              <OrganizationDirectoryRefresh/>
            </div>
          </div>
          <p role="status" className="text-sm text-body">{q?matching.length+" of "+organizations.length:organizations.length} organizations · Page {page} of {totalPages}</p>
          <DataTable caption="Existing Organizations" empty={<EmptyState
            title={q?"No matching organizations. Clear search to see all.":"No organizations found."}
            description={q?"Clear search to see all.":"Create a new organization if you have permission."}/>}
            columns={columns} rows={visible} getRowKey={organization=>organization.id}/>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-body">
              <span>{matching.length?(page-1)*pageSize+1:0}–{Math.min(page*pageSize,matching.length)} of {matching.length}</span>
              <form method="get" className="flex items-center gap-2">
                <input type="hidden" name="q" value={q}/>
                <label htmlFor="org-page-size" className="text-xs">Rows per page</label>
                <Select id="org-page-size" name="pageSize" defaultValue={String(pageSize)}>
                  {[10,25,50,100].map(size=><option key={size} value={size}>{size}</option>)}
                </Select>
                <Button type="submit" variant="secondary" size="sm">Apply</Button>
              </form>
            </div>
            <Pagination label="Organization pages" page={page} pageCount={totalPages} hrefForPage={href}/>
          </div>
        </section>
      </div>
      {canCreate?<section aria-label="Deleted Items" className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Deleted Items</h2>
            <p className="mt-1 text-xs text-muted-foreground">Restoring a parent does not automatically restore its children. Select an entity type to inspect authorized archived records.</p>
          </div>
          <form method="get" className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-sm font-semibold text-body">Entity type
              <Select name="type" defaultValue={selectedRestoreType}>
                {RECOVERY_ENTITY_TYPES.map(entity=><option value={entity.value} key={entity.value}>
                  {entity.label}
                </option>)}
              </Select>
            </label>
            <Button type="submit" variant="secondary" size="sm">View</Button>
          </form>
        </div>
        {!archiveResponse.ok?<ErrorState title="Unable to load archived organizations"
          description="Archived inventory is temporarily unavailable; no empty-state claim is made."
          action={<Link href="/admin/organizations?type=organization" className="font-semibold text-link underline">Retry</Link>}/>:
        selectedRestoreType==="organization"?<div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[460px] border-collapse text-left text-sm">
            <caption className="sr-only">Archived organizations (first 200 in the authorized scope)</caption>
            <thead className="bg-[var(--lms-neutral-50)]"><tr>
              {["Name","Details","Restore"].map(label=><th key={label} className="border-b border-border px-3 py-3" scope="col">{label}</th>)}
            </tr></thead>
            <tbody>{archived.map(organization=><tr key={organization.id} className="border-b border-border">
              <th scope="row" className="px-3 py-3 font-semibold">{organization.name}</th>
              <td className="px-3 py-3 text-muted-foreground">{organizationCreatedIstDate(organization.createdAt)} · Archived
                {organization.updatedAt?" · Updated "+organizationCreatedIstDate(organization.updatedAt):""}</td>
              <td className="px-3 py-3"><TenantRestoreAction kind="organization" id={organization.id} name={organization.name}/></td>
            </tr>)}</tbody>
          </table>
          {!archived.length?<EmptyState title="No archived organizations" description="No archived organizations in this scope."/>:null}
          {archived.length>=200?<p className="mt-2 text-xs text-muted-foreground">Only the first 200 archived organizations are shown.</p>:null}
        </div>:<div role="status" className="rounded-[var(--lms-control-radius)] border border-border p-4 text-sm text-body">
          <strong>{RECOVERY_ENTITY_TYPES.find(item=>item.value===selectedRestoreType)?.label} recovery</strong>
          <p className="mt-2">The entity type is recognized in the legacy Deleted Items registry, but no authorized self-service inventory and restore transaction is available for this type yet.</p>
          <p className="mt-1 text-muted-foreground">Use the current college or platform administration workflow for recovery; this screen will not offer a non-working Restore control.</p>
        </div>}
      </section>:null}

    </div>
  );
}
