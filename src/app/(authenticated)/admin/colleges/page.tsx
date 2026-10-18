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
import { can } from "@/modules/permissions/policy";
import {canManageCollegeDirectoryRow} from "@/modules/colleges/admin-directory-access-model";
import { listColleges } from "@/modules/colleges/service";
import { listOrganizations } from "@/modules/organizations/service";

type CollegeRow = Awaited<ReturnType<typeof listColleges>>[number] & {canManage:boolean;organizationName:string};

const columns: DataTableColumn<CollegeRow>[] = [
  {
    key: "name",
    header: "Name",
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
    header: <span className="sr-only">Actions</span>,
    className: "text-right",
    cell: (college) => (
      <div className="flex justify-end gap-2">
        <Link href={`/admin/colleges/${encodeURIComponent(college.id)}`}
          className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-[var(--lms-link-text)] hover:bg-primary-subtle">
          Tenant setup
        </Link>
        <Link
          href={`/admin/colleges/${encodeURIComponent(college.id)}/readiness`}
          className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-[var(--lms-link-text)] hover:bg-primary-subtle"
        >
          Readiness
        </Link>
        <Link
          href={`/admin/colleges/${encodeURIComponent(college.id)}/branding`}
          className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-[var(--lms-link-text)] hover:bg-primary-subtle"
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
  const raw=await searchParams;
  const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
  const q=(first(raw.q)??"").trim().slice(0,100);
  const size=Number(first(raw.pageSize)??25);
  const pageSize=[10,25,50,100].includes(size)?size:25;
  const normalized=q.toLocaleLowerCase("en-IN");
  const matches=rows.filter(item=>[item.name,item.code,item.city,item.organizationName].some(
   value=>value?.toLocaleLowerCase("en-IN").includes(normalized)));
  const pages=Math.max(1,Math.ceil(matches.length/pageSize));
  const requestedPage=Number(first(raw.page)??1);
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
      {creatableOrganizations.length>0?<CollegeBulkImport organizations={creatableOrganizations.map(x=>({id:x.id,name:x.name}))}/>:null}
      <Link href="/admin/tenants" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-[var(--lms-link-text)]">
        Search tenant directory →
      </Link>
      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4" method="get">
       <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm font-semibold">Search college, code, city or organization
        <input type="search" name="q" defaultValue={q} maxLength={100} className="min-h-11 rounded border border-border px-3" />
       </label>
       <label className="flex flex-col gap-1 text-sm font-semibold">Rows per page
        <select name="pageSize" defaultValue={String(pageSize)} className="min-h-11 rounded border border-border px-3">
         {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
        </select>
       </label>
       <button type="submit" className="min-h-11 rounded bg-primary px-4 text-on-primary">Search</button>
       <Link href="/admin/colleges" className="min-h-11 inline-flex items-center text-[var(--lms-link-text)] underline">Clear search</Link>
       <Link href={href(page)} className="min-h-11 inline-flex items-center text-[var(--lms-link-text)] underline">Refresh</Link>
      </form>
      <p role="status" className="text-sm text-body">{q?matches.length+" of "+rows.length:rows.length} colleges · Page {page} of {pages}</p>
      {rows.length === 0 ? (
        <EmptyState title="No active colleges in this scope"
          description="No college records are visible under the selected Super Admin safety scope. Clear or change the scope to search elsewhere; no tenants were modified." />
      ) : null}
      <div className="grid min-w-0 gap-3 lg:hidden" aria-label="College onboarding cards">
        {visible.map(college=>(
          <article key={college.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
            <h2 className="break-words text-base font-semibold text-foreground">{college.name}</h2>
            <p className="mt-1 break-words text-xs text-muted-foreground">{college.code}</p>
            <p className="mt-2 break-words text-sm text-body">{[college.city,college.state,college.country].filter(Boolean).join(", ")||"Location not recorded"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link href={`/admin/colleges/${encodeURIComponent(college.id)}`}
                className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold text-[var(--lms-link-text)]">Tenant setup</Link>
              <Link href={`/admin/colleges/${encodeURIComponent(college.id)}/branding`}
                className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold text-[var(--lms-link-text)]">Branding</Link>
              <Link href={`/admin/colleges/${encodeURIComponent(college.id)}/readiness`}
                className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold text-[var(--lms-link-text)]">Readiness</Link>
              {college.canManage ? <>
                <CollegeEditDialog college={college}/>
                <CollegeArchiveButton collegeId={college.id} name={college.name}/>
              </> : null}
            </div>
          </article>
        ))}
      </div>
      <div className="hidden min-w-0 lg:block">
        <DataTable columns={columns} rows={visible} getRowKey={(college)=>college.id}
           empty={<EmptyState title="No active colleges in this scope" description="No college records are visible under the selected Super Admin safety scope. Clear or change the scope to search elsewhere; no tenants were modified."/>}/>
      </div>
      <nav aria-label="College directory pages" className="flex flex-wrap gap-3 text-sm">
       {page>1?<Link href={href(page-1)} className="min-h-11 rounded border border-border px-3 py-2">Previous</Link>:null}
       {page<pages?<Link href={href(page+1)} className="min-h-11 rounded border border-border px-3 py-2">Next</Link>:null}
      </nav>
    </div>
  );
}
