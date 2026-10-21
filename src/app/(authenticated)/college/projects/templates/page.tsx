import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthorizationError } from "@/modules/permissions/policy";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {ProjectAdminMissingCollege} from "@/components/projects/project-admin-missing-college";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { ProjectTemplateCatalogueExport } from "@/components/projects/project-template-catalogue-export";
import { projectTemplateSectionCounts } from "@/modules/projects/project-template-catalogue-model";

export default async function CollegeProjectTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  const collegeId = getProjectAdminCollegeId(context);
  if (!collegeId) return <ProjectAdminMissingCollege/>;

  const params = await searchParams;
  const legacySearch = Array.isArray(params.search)?params.search[0]:params.search;
  if (!params.q && legacySearch) redirect("/college/projects/templates?q="+encodeURIComponent(legacySearch.trim().slice(0,120)));

  const templateRead = await listAssignedProjectTemplates(context, collegeId)
    .then(value=>({ok:true as const,value}))
    .catch((error:unknown)=>{ if(error instanceof AuthorizationError)throw error;return {ok:false as const}; });
  if(!templateRead.ok) return <div className="min-w-0 space-y-6">
    <PageHeader title="Templates"
      description="Published project templates assigned to this college."/>
    <ErrorState title="Templates could not be loaded"
      description="The assigned template catalogue could not be loaded. Your filters were not changed."
      action={<Link href="/college/projects/templates"
        className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Retry loading templates</Link>}/>
  </div>;
  const templates = templateRead.value;

  const rawSearch = params.q;
  const q = (Array.isArray(rawSearch) ? rawSearch[0] : rawSearch ?? "").trim().slice(0, 120);
  const visible = templates.filter((template) =>
    (template.title + " " + template.slug + " " + template.version)
      .toLowerCase().includes(q.toLowerCase()),
  );
  const rows = visible.map((template) => ({
    templateId: template.templateId,
    title: template.title,
    version: template.version,
    sections: projectTemplateSectionCounts(template.blueprint),
  }));

  const columns:DataTableColumn<(typeof visible)[number]>[]=[
    {key:"template",header:"Template",mobilePriority:"primary",cell:template=><div>
      <p className="font-semibold">{template.title}</p>
      {template.summary?<p className="mt-1 max-w-lg text-xs text-muted-foreground leading-5">{template.summary}</p>:null}
    </div>},
    {key:"version",header:"Version",cell:template=><StatusBadge tone="neutral">Version {template.version}</StatusBadge>},
    {key:"sections",header:"Sections",cell:template=>{
      const counts=projectTemplateSectionCounts(template.blueprint);
      return `${counts.overview} overview · ${counts.releases} releases · ${counts.sprints} sprints · ${counts.tasks} tasks · ${counts.resources} resources`;
    }},
    {key:"action",header:"Action",mobilePriority:"action",cell:template=>
      <Link href={"/college/projects/templates/"+template.templateId}
        className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">View template</Link>},
  ];
  return (
    <div className="min-w-0 space-y-6">
      <ProjectAdminNav
        basePath="/college/projects"
        active="templates"
      />
      <PageHeader
        title="Templates"
        description="Published project templates assigned to this college."
      />
      <form action="/college/projects/templates" method="get" role="search" aria-label="Project template search"
        className="flex min-w-0 flex-wrap items-end max-[767px]:flex-col max-[767px]:items-stretch gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
        <label className="w-full min-w-0 flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] min-[768px]:w-auto">
          Search templates
          <Input type="search" name="q" maxLength={120} defaultValue={q}
            placeholder="Search by template or version"
            className="mt-1 min-h-11 w-full min-w-0 md:min-h-9" />
        </label>
        <Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">
          Search
        </Button>
        {q ? <Link href="/college/projects/templates" className="py-2 text-sm text-link underline min-h-11 md:min-h-9 inline-flex items-center lms-inline-link hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Clear search
        </Link> : null}

      </form>
      <ListToolbar label="Assigned project templates" viewCount={visible.length}
        exportAction={<ProjectTemplateCatalogueExport rows={rows} />} />
      <DataTable caption="Assigned project templates" columns={columns} rows={visible}
        getRowKey={template=>template.assignmentId}
        empty={<EmptyState
          title={templates.length===0?"No assigned project templates":"No matching project templates"}
          description={templates.length===0?"No project templates are currently assigned to this college.":"No project templates match this search."}
          action={q?<Link href="/college/projects/templates"
            className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear search</Link>:undefined}
        />} />
    </div>
  );
}
