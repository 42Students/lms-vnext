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
      <div className="flex min-w-0 flex-wrap justify-start gap-2 sm:justify-end">
        <Link href={`/admin/colleges/${encodeURIComponent(college.id)}`}
          className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
          Tenant setup
        </Link>
        <Link
          href={`/admin/colleges/${encodeURIComponent(college.id)}/readiness`}
          className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
        >
          Readiness
        </Link>
        <Link
          href={`/admin/colleges/${encodeURIComponent(college.id)}/branding`}
          className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
        >
          Branding
        </Link>
        {college.canManage ? <>
          <CollegeEditDialog college={college} />
          <CollegeArchiveButton collegeId={college.id} name={college.name} />
        </> : null}
      </div>
    ),
  },
];

export default async function CollegesPage({searchParams}:{searchParams:Promise<{q?:string|string[];page?:string|string[];pageSize?:string|string[]}>}) {
  const context = await getCurrentRequestContext();
  requirePermission(context, "admin-scope.select");
  const filters=parseAdminDirectorySearchParams(await searchParams);
  if (!filters) return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="Super Admin" title="Colleges"/>
    <ErrorState title="Invalid college directory filters"
      description="Search text must be 100 characters or less; choose a valid page and page size. Remove repeated or unsupported filters."
      action={<Link href="/admin/colleges" className="inline-flex min-h-11 items-center font-semibold underline">Clear filters</Link>}/>
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
    <div className="min-w-0 space-y-6">
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
      {creatableOrganizations.length>0?<CollegeBulkImport organizations={creatableOrganizations.map(x=>({id:x.id,name:x.name}))}/>:null}
      <Link href="/admin/tenants" className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
        Search tenant directory →
      </Link>
      <form className="flex flex-wrap items-end gap-3 border-t border-border pt-4" method="get">
       <label className="flex min-w-0 w-full flex-1 flex-col gap-1 text-sm font-semibold sm:min-w-48">Search college, code, city or organization
        <Input type="search" name="q" defaultValue={q} maxLength={100} className="min-h-[var(--lms-control-height)]  w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border px-3" />
       </label>
       <label className="flex flex-col gap-1 text-sm font-semibold">Rows per page
        <Select name="pageSize" defaultValue={String(pageSize)} className="min-h-[var(--lms-control-height)]  rounded-[var(--lms-control-radius)] border border-border px-3">
         {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
        </Select>
       </label>
       <Button type="submit" className="min-h-[var(--lms-control-height)]  rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-[var(--lms-on-primary)]">Search</Button>
       <Link href="/admin/colleges" className="min-h-11 inline-flex items-center text-primary-text underline">Clear search</Link>
       <Link href={href(page)} className="min-h-11 inline-flex items-center text-primary-text underline">Refresh</Link>
      </form>
      <p role="status" className="text-sm text-body">{q?matches.length+" of "+rows.length:rows.length} colleges · Page {page} of {pages}</p>
      <DataTable columns={columns} rows={visible} getRowKey={college=>college.id}
        caption="Colleges"
        empty={<EmptyState title={q ? "No colleges match your search" : "No active colleges in this scope"}
          description="No college records are visible under the selected Super Admin safety scope. Clear or change the scope to search elsewhere; no tenants were modified."/>}/>
      <Pagination page={page} pageCount={pages} hrefForPage={href} label="College directory pages"/>
    </div>
  );
}
