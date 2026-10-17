import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProjectTemplateActions } from "@/components/projects/project-template-controls";
import { SuperAdminTemplateTabs } from "@/components/projects/super-admin-template-tabs";
import {SuperAdminTemplateCollegeBulk} from "@/components/projects/super-admin-template-college-bulk";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { can } from "@/modules/permissions/policy";
import { projectTemplateIdSchema } from "@/modules/projects/validation";
import { templateCollegeAvailabilityQuerySchema, templateCollegeAvailabilityHref } from "@/modules/projects/template-college-availability-model";
import { listSuperAdminTemplateCollegeAvailability } from "@/modules/projects/template-college-availability-service";
export default async function TemplateCollegeAvailabilityPage({ params, searchParams }: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  const id = projectTemplateIdSchema.safeParse((await params).templateId);
  if (!id.success) notFound();
  const raw = await searchParams;
  const parsed = templateCollegeAvailabilityQuerySchema.safeParse({ q: raw.q, status: raw.status, page: raw.page });
  if (!parsed.success) return <ErrorState title="Invalid college filters" description="Review the search, status and page."
    action={<Link href={templateCollegeAvailabilityHref(id.data, {})}>Clear filters</Link>} />;
  let data;
  try { data = await listSuperAdminTemplateCollegeAvailability(context, id.data, parsed.data); }
  catch (error) {
    if (error instanceof ProjectsServiceError && error.code === "PROJECT_TEMPLATE_NOT_FOUND") notFound();
    throw error;
  }
  const statuses = ["ALL", "ASSIGNED", "UNASSIGNED"] as const;
  return <div className="min-w-0 space-y-5">
    <PageHeader eyebrow="Super Admin · Template college availability" title={data.template.title}
      description="Availability within the current safety scope. Existing workspaces retain their pinned versions." />
    <SuperAdminTemplateTabs templateId={id.data} active="colleges" />
    <form method="get" className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
      <label className="grid gap-1 text-sm font-semibold text-body">College name or code
        <input name="q" type="search" maxLength={100} defaultValue={data.query.q} className="min-h-11 rounded-md border border-border bg-surface px-3" /></label>
      <label className="grid gap-1 text-sm font-semibold text-body">Availability
        <select name="status" defaultValue={data.query.status} className="min-h-11 rounded-md border border-border bg-surface px-3">
          {statuses.map(status => <option key={status}>{status}</option>)}
        </select></label>
      <button className="min-h-11 self-end rounded-md bg-primary px-4 font-semibold text-on-primary" type="submit">Filter</button>
    </form>
    <p className="text-xs text-muted-foreground">{data.total} matching active colleges · page {data.query.page} of {data.totalPages}</p>
    <SuperAdminTemplateCollegeBulk templateId={id.data} published={data.template.status==="PUBLISHED"}
      colleges={data.items.map(row=>({id:row.id,name:row.name,assigned:Boolean(row.assignment),
        canAssign:can(context,"project-template.assign",{collegeId:row.id,organizationId:row.organizationId})}))}/>
    {data.items.length ? <div className="grid gap-3 md:grid-cols-2">
      {data.items.map(row => <article key={row.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
        <h2 className="break-words text-base font-semibold text-foreground">{row.name}</h2>
        <p className="text-xs text-muted-foreground">{row.code}</p>
        <StatusBadge tone={row.assignment ? "success" : "neutral"}>{row.assignment ? "Assigned" : "Not assigned"}</StatusBadge>
        {row.assignment ? <p className="text-sm text-body">Pinned version {row.assignment.assignedVersion ?? "Unresolved"} ·
          {" "}{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(row.assignment.assignedAt)} IST</p> : null}
        {can(context, "project-template.assign", { collegeId: row.id, organizationId: row.organizationId }) ?
          <div className="mt-3"><ProjectTemplateActions templateId={id.data} title={data.template.title}
            status={data.template.status} selectedCollegeId={row.id} assignedToSelectedCollege={Boolean(row.assignment)} allowGlobalActions={false} /></div> : null}
      </article>)}
    </div> : <EmptyState title="No matching colleges" description="No active colleges match the filters in the current safety scope." />}
    <nav aria-label="College availability pages" className="flex flex-wrap gap-4 text-sm font-semibold text-primary-text">
      {data.query.page > 1 ? <Link href={templateCollegeAvailabilityHref(id.data, { ...data.query, page: data.query.page - 1 })}>Previous</Link> : null}
      {data.query.page < data.totalPages ? <Link href={templateCollegeAvailabilityHref(id.data, { ...data.query, page: data.query.page + 1 })}>Next</Link> : null}
    </nav>
  </div>;
}
