import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeCreateForm } from "@/components/admin/college-create-form";
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
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
          Tenant setup
        </Link>
        <Link
          href={`/admin/colleges/${encodeURIComponent(college.id)}/readiness`}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
        >
          Readiness
        </Link>
        <Link
          href={`/admin/colleges/${encodeURIComponent(college.id)}/branding`}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
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

export default async function CollegesPage() {
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
      <Link href="/admin/tenants" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Search tenant directory →
      </Link>
      {rows.length === 0 ? (
        <EmptyState title="No active colleges in this scope"
          description="No college records are visible under the selected Super Admin safety scope. Clear or change the scope to search elsewhere; no tenants were modified." />
      ) : null}
      <div className="grid min-w-0 gap-3 lg:hidden" aria-label="College onboarding cards">
        {rows.map(college=>(
          <article key={college.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
            <h2 className="break-words text-base font-semibold text-foreground">{college.name}</h2>
            <p className="mt-1 break-words text-xs text-muted-foreground">{college.code}</p>
            <p className="mt-2 break-words text-sm text-body">{[college.city,college.state,college.country].filter(Boolean).join(", ")||"Location not recorded"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link href={`/admin/colleges/${encodeURIComponent(college.id)}`}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Tenant setup</Link>
              <Link href={`/admin/colleges/${encodeURIComponent(college.id)}/branding`}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Branding</Link>
              <Link href={`/admin/colleges/${encodeURIComponent(college.id)}/readiness`}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Readiness</Link>
              {college.canManage ? <>
                <CollegeEditDialog college={college}/>
                <CollegeArchiveButton collegeId={college.id} name={college.name}/>
              </> : null}
            </div>
          </article>
        ))}
      </div>
      <div className="hidden min-w-0 lg:block">
        <DataTable columns={columns} rows={rows} getRowKey={(college)=>college.id}/>
      </div>
    </div>
  );
}
