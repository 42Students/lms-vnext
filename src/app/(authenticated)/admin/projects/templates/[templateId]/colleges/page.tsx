import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveTemplateCollegeLegacyId, TemplateCollegeReadError } from "@/modules/projects/template-college-availability-service";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
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
  if (!can(context,"project-template.read")) return <div className="min-w-0 space-y-4">
    <PageHeader title="College availability" />
    <ErrorState title="College availability access denied"
      description="Only an active Super Admin can read global project template assignments."
      action={<PageBackLink href="/admin/projects/templates" label="Back to templates" />} />
  </div>;
  const rawId = (await params).templateId;
  let id: string;
  try {
    id=projectTemplateIdSchema.parse(await resolveTemplateCollegeLegacyId(context,rawId));
  } catch (error) {
    if(error instanceof ProjectsServiceError && error.code==="PROJECT_TEMPLATE_NOT_FOUND") return <div className="min-w-0 space-y-4">
      <PageHeader title="Template not found" />
      <ErrorState title="Template not found" description="This project template may have moved or been retired."
        action={<PageBackLink href="/admin/projects/templates" label="Back to templates" />}/>
    </div>;
    if(error instanceof Error && error.name==="ZodError") notFound();
    throw error;
  }

  const raw = await searchParams;
  const parsed = templateCollegeAvailabilityQuerySchema.safeParse({ q: raw.q, status: raw.status, page: raw.page });
  if (!parsed.success) return <div className="min-w-0 space-y-4">
    <PageHeader title="College availability" />
    <ErrorState title="Invalid college filters" description="Review the search, status and page."
      action={<Link href={templateCollegeAvailabilityHref(id,{})}
        className="font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] underline-offset-4 w-full md:w-auto min-h-11 md:min-h-9">Clear filters</Link>} />
  </div>;
  let data;
  try { data = await listSuperAdminTemplateCollegeAvailability(context, id, parsed.data); }
  catch (error) {
    if (error instanceof ProjectsServiceError && error.code === "PROJECT_TEMPLATE_NOT_FOUND") return <div className="min-w-0 space-y-4">
      <PageHeader title="Template not found" />
      <ErrorState title="Template not found" description="This project template is no longer available."
        action={<PageBackLink href="/admin/projects/templates" label="Back to templates" />}/>
    </div>;
    // A failed college/template read must never be interpreted as an empty
    // assignment list. Keep the filters for an explicit retry instead.
    return <div className="min-w-0 space-y-4">
      <PageHeader title="College availability" />
      <ErrorState title={error instanceof TemplateCollegeReadError && error.source==="TEMPLATE" ? "Template could not be loaded" : "College assignments could not be loaded"}
        description="A required source could not be read. No availability is inferred until it succeeds."
        action={<Link href={templateCollegeAvailabilityHref(id,parsed.data)} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Retry loading colleges</Link>} />
    </div>;
  }
  const statuses = ["ALL", "ASSIGNED", "UNASSIGNED"] as const;
  return <div className="min-w-0 space-y-4">
    <div className="min-w-0">
      <Link href="/admin/projects/templates" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]">← Back to templates</Link>
      <PageHeader title={data.template.title}
        description="Availability within the current safety scope. Existing workspaces retain their pinned versions." />
    </div>
    <SuperAdminTemplateTabs templateId={id} active="colleges" />
    <FilterBar title="Filters">
    <form method="get" className="grid min-w-0 gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] md:grid-cols-2 lg:grid-cols-3">
      <label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">College name or code
        <Input name="q" type="search" maxLength={100} defaultValue={data.query.q} className="w-full" placeholder="Search colleges..." /></label>
      <label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Availability
        <Select name="status" defaultValue={data.query.status} className="w-full">
          {statuses.map(status => <option key={status}>{status}</option>)}
        </Select></label>
      <Button className="min-h-11 w-full self-end md:min-h-9" type="submit">Filter</Button>
    </form>
    </FilterBar>
    <p className="text-xs text-muted-foreground">{data.total.toLocaleString("en-IN")} matching active colleges · page {data.query.page} of {data.totalPages}</p>
    <SuperAdminTemplateCollegeBulk templateId={id} published={data.template.status==="PUBLISHED"}
      colleges={data.items.map(row=>({id:row.id,name:row.name,assigned:Boolean(row.assignment),
        canAssign:can(context,"project-template.assign",{collegeId:row.id,organizationId:row.organizationId})}))}/>
    <DataTable<(typeof data.items)[number]> caption="Template college availability"
      rows={data.items} getRowKey={row=>row.id}
      columns={[
        {key:"college",header:"College",mobilePriority:"primary",cell:row=><>
          <span className="break-words font-semibold text-foreground">{row.name}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{row.code}</span>
        </>},
        {key:"availability",header:"Availability",mobilePriority:"secondary",cell:row=>
          <StatusBadge tone={row.assignment?"success":"neutral"}>{row.assignment?"Assigned":"Not assigned"}</StatusBadge>},
        {key:"version",header:"Assigned version",mobilePriority:"secondary",cell:row=>row.assignment?
          <span className="text-sm text-body">Pinned version {row.assignment.assignedVersion??"Unresolved"}</span>:"—"},
        {key:"assignedAt",header:"Assigned on",mobilePriority:"secondary",cell:row=>row.assignment?
          new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(row.assignment.assignedAt)+" IST":"—"},
        {key:"actions",header:"Actions",mobilePriority:"action",cell:row=>
          can(context,"project-template.assign",{collegeId:row.id,organizationId:row.organizationId})?
            <ProjectTemplateActions templateId={id} title={data.template.title}
              status={data.template.status} selectedCollegeId={row.id}
              assignedToSelectedCollege={Boolean(row.assignment)} allowGlobalActions={false}/>:null},
      ]}
      empty={<EmptyState title="No matching colleges" description="No active colleges match the filters in the current safety scope."
        action={<Link href={templateCollegeAvailabilityHref(id,{})} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 hover:text-[var(--lms-primary-text)] w-full md:w-auto">Clear filters</Link>}/>}
    />
    <Pagination page={data.query.page} pageCount={data.totalPages} hrefForPage={page=>templateCollegeAvailabilityHref(id,{...data.query,page})} label="College availability pages" />
  </div>;
}
