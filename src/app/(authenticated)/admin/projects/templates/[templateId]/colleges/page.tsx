import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
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
  if (!can(context,"project-template.read")) return <div className="min-w-0 space-y-5">
    <PageHeader eyebrow="Super Admin · Template college availability" title="College availability" />
    <ErrorState title="College availability access denied"
      description="Only an active Super Admin can read global project template assignments."
      action={<Link href="/admin/projects/templates" className="font-semibold text-primary-text">Back to template catalogue</Link>} />
  </div>;
  const raw = await searchParams;
  const parsed = templateCollegeAvailabilityQuerySchema.safeParse({ q: raw.q, status: raw.status, page: raw.page });
  if (!parsed.success) return <ErrorState title="Invalid college filters" description="Review the search, status and page."
    action={<Link href={templateCollegeAvailabilityHref(id.data, {})}>Clear filters</Link>} />;
  let data;
  try { data = await listSuperAdminTemplateCollegeAvailability(context, id.data, parsed.data); }
  catch (error) {
    if (error instanceof ProjectsServiceError && error.code === "PROJECT_TEMPLATE_NOT_FOUND") notFound();
    // A failed college/template read must never be interpreted as an empty
    // assignment list. Keep the filters for an explicit retry instead.
    return <div className="min-w-0 space-y-5">
      <PageHeader eyebrow="Super Admin · Template college availability" title="College availability" />
      <ErrorState title="College availability unavailable"
        description="Template assignments could not be loaded. No availability is shown until the read succeeds."
        action={<Link href={templateCollegeAvailabilityHref(id.data,parsed.data)} className="font-semibold text-primary-text">Retry loading colleges</Link>} />
    </div>;
  }
  const statuses = ["ALL", "ASSIGNED", "UNASSIGNED"] as const;
  return <div className="min-w-0 space-y-5">
    <PageHeader eyebrow="Super Admin · Template college availability" title={data.template.title}
      description="Availability within the current safety scope. Existing workspaces retain their pinned versions."
      actions={<Link href="/admin/projects/templates" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">← Template catalogue</Link>} />
    <SuperAdminTemplateTabs templateId={id.data} active="colleges" />
    <form method="get" className="grid gap-3 border-b border-border pb-4 sm:grid-cols-3">
      <label className="grid gap-1 text-sm font-semibold text-body">College name or code
        <Input name="q" type="search" maxLength={100} defaultValue={data.query.q} className="w-full" /></label>
      <label className="grid gap-1 text-sm font-semibold text-body">Availability
        <Select name="status" defaultValue={data.query.status} className="w-full">
          {statuses.map(status => <option key={status}>{status}</option>)}
        </Select></label>
      <Button className="self-end" type="submit">Filter</Button>
    </form>
    <p className="text-xs text-muted-foreground">{data.total} matching active colleges · page {data.query.page} of {data.totalPages}</p>
    <SuperAdminTemplateCollegeBulk templateId={id.data} published={data.template.status==="PUBLISHED"}
      colleges={data.items.map(row=>({id:row.id,name:row.name,assigned:Boolean(row.assignment),
        canAssign:can(context,"project-template.assign",{collegeId:row.id,organizationId:row.organizationId})}))}/>
    {data.items.length ? <div className="grid gap-3 md:grid-cols-2">
      {data.items.map(row => <article key={row.id} className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
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
    <Pagination page={data.query.page} pageCount={data.totalPages} hrefForPage={page=>templateCollegeAvailabilityHref(id.data,{...data.query,page})} label="College availability pages" />
  </div>;
}
