import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeCreateForm } from "@/components/admin/college-create-form";
import {CollegeBulkImport} from "@/components/admin/college-bulk-import";
import { CollegeArchiveButton } from "@/components/admin/college-archive-button";
import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Disclosure } from "@/components/ui/disclosure";
import { Dropdown } from "@/components/ui/dropdown";
import { ErrorState } from "@/components/ui/error-state";
import { parseAdminDirectorySearchParams } from "@/modules/colleges/admin-directory-query-model";
import { Pagination } from "@/components/ui/pagination";
import { can, requirePermission } from "@/modules/permissions/policy";
import {canManageCollegeDirectoryRow} from "@/modules/colleges/admin-directory-access-model";
import { listColleges } from "@/modules/colleges/service";
import { listOrganizations } from "@/modules/organizations/service";

type CollegeRow = Awaited<ReturnType<typeof listColleges>>[number] & {canManage:boolean;organizationName:string};

const columns: DataTableColumn<CollegeRow>[] = [
  {
    key: "name",
    header: "Name",
    mobilePriority: "primary",
    cell: (college) => <span className="font-semibold text-foreground">{college.name}</span>,
  },
  {
    key: "organization",
    header: "Organization",
    cell: (college) => college.organizationName,
  },
  {
    key: "uniqueId",
    header: "Unique ID",
    cell: (college) => college.code,
  },
  {
    key: "city",
    header: "City",
    cell: (college) => college.city || "—",
  },
  {
    key: "state",
    header: "State",
    cell: (college) => college.state || "—",
  },
  {
    key: "actions",
    mobilePriority: "action",
    header: <span className="sr-only">Actions</span>,
    className: "text-right",
    cell: (college) => (
      <div className="flex min-w-0 flex-wrap justify-start gap-2 md:justify-end">
        <Link href={`/admin/colleges/${encodeURIComponent(college.id)}`}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Tenant setup
        </Link>
        <Dropdown trigger="More" label="College actions" align="end" mobileSheet triggerClassName="md:!min-h-9">
          <div className="grid min-w-0 gap-[var(--lms-space-2)]">
        <Link role="menuitem"
          href={`/admin/colleges/${encodeURIComponent(college.id)}/readiness`}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
        >
          Readiness
        </Link>
        <Link role="menuitem"
          href={`/admin/colleges/${encodeURIComponent(college.id)}/branding`}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
        >
          Branding
        </Link>
        {college.canManage ? <>
          <CollegeEditDialog college={college} />
          <CollegeArchiveButton collegeId={college.id} name={college.name} />
        </> : null}
          </div>
        </Dropdown>
      </div>
    ),
  },
];

export default async function CollegesPage({searchParams}:{searchParams:Promise<{q?:string|string[];page?:string|string[];pageSize?:string|string[]}>}) {
  const context = await getCurrentRequestContext();
  requirePermission(context, "admin-scope.select");
  const filters=parseAdminDirectorySearchParams(await searchParams);
  if (!filters) return <div className="min-w-0 space-y-[var(--lms-space-6)]">
    <PageHeader title="Colleges"/>
    <ErrorState title="Invalid college directory filters"
      description="Search text must be 100 characters or less; choose a valid page and page size. Remove repeated or unsupported filters."
      action={<Link href="/admin/colleges" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 underline-offset-4">Clear filters</Link>}/>
  </div>;
  const [colleges, organizations] = await Promise.all([
    listColleges(context),
    listOrganizations(context),
  ]);
  const organizationNames=new Map(organizations.map(x=>[x.id,x.name]));
  const rows:CollegeRow[] = colleges.map(college=>({
    ...college,
    organizationName:organizationNames.get(college.organizationId)??"—",
    canManage:canManageCollegeDirectoryRow(context,college),
  }));
  const {q,pageSize}=filters;
  const normalized=q.toLocaleLowerCase("en-IN");
  const matches=rows.filter(item=>[item.name,item.code,item.city,item.organizationName].some(
   value=>value?.toLocaleLowerCase("en-IN").includes(normalized)));
  const pages=Math.max(1,Math.ceil(matches.length/pageSize));
  const requestedPage=filters.page;
  const page=Number.isSafeInteger(requestedPage)?Math.max(1,Math.min(pages,requestedPage)):1;
  const visible=matches.slice((page-1)*pageSize,page*pageSize);
  const href=(n:number)=>"/admin/colleges?"+new URLSearchParams({
   ...(q?{q}:{}),page:String(n),pageSize:String(pageSize),
  }).toString();
  const creatableOrganizations = organizations.filter(
    (organization) =>
      can(context, "college.manage", {
        organizationId: organization.id,
      }),
  );

  return (
    <div className="min-w-0 space-y-[var(--lms-space-6)]">
      <PageHeader
        title="Colleges"
        description="Active colleges are constrained by the selected Super Admin safety scope."
        actions={<Link href="/admin/tenants" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9">Search tenant directory →</Link>}
      />
      {creatableOrganizations.length > 0 ? (
        <Disclosure title="Create College" ariaLabel="Create college" contentClassName="pt-[var(--lms-space-3)] pb-[var(--lms-space-4)]">
        <CollegeCreateForm
          organizations={creatableOrganizations.map(
            (organization) => ({
              id: organization.id,
              name: organization.name,
            }),
          )}
        />
        </Disclosure>
      ) : organizations.length === 0 ? (
        <EmptyState
          title="Create an organization first"
          description="Every college belongs to an organization, so the organization is the required first tenant boundary."
        />
      ) : null}
      <form role="search" aria-label="Search colleges" className="grid min-w-0 items-end gap-[var(--lms-space-3)] border-y border-border py-[var(--lms-space-4)] md:grid-cols-[minmax(0,1fr)_auto_auto]" method="get">
       <label className="flex min-w-0 w-full flex-1 flex-col gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] md:min-w-48">Search college, code, city or organization
        <Input type="search" name="q" defaultValue={q} maxLength={100} />
       </label>
       <label className="flex flex-col gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rows per page
        <Select name="pageSize" defaultValue={String(pageSize)}>
         {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
        </Select>
       </label>
       <Button type="submit" className="w-full md:w-auto">Search</Button>
       <Link href="/admin/colleges" className="inline-flex min-h-11 items-center text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 underline-offset-4">Clear search</Link>
       <Link href={href(page)} className="inline-flex min-h-11 items-center text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 underline-offset-4">Refresh</Link>
      </form>
      <p role="status" className="text-sm text-muted-foreground tabular-nums">{q?matches.length+" of "+rows.length:rows.length} colleges · Page {page} of {pages}</p>
      <DataTable columns={columns} rows={visible} getRowKey={college=>college.id}
        caption="Colleges"
        empty={<EmptyState title={q ? "No colleges match your search" : "No active colleges in this scope"}
          description="No college records are visible under the selected Super Admin safety scope. Clear or change the scope to search elsewhere; no tenants were modified."/>}/>
      <Pagination page={page} pageCount={pages} hrefForPage={href} label="College directory pages"/>
      {creatableOrganizations.length>0?<CollegeBulkImport organizations={creatableOrganizations.map(x=>({id:x.id,name:x.name}))}/>:null}
    </div>
  );
}
