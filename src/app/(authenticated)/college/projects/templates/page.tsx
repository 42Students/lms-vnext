import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {ProjectAdminMissingCollege} from "@/components/projects/project-admin-missing-college";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { StatusBadge } from "@/components/ui/status-badge";
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

  const templates =
    await listAssignedProjectTemplates(
      context,
      collegeId,
    );

  const params = await searchParams;
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
      {template.summary?<p className="mt-1 max-w-lg text-xs text-muted-foreground">{template.summary}</p>:null}
    </div>},
    {key:"version",header:"Version",cell:template=><StatusBadge tone="success">Version {template.version}</StatusBadge>},
    {key:"sections",header:"Sections",cell:template=>{
      const counts=projectTemplateSectionCounts(template.blueprint);
      return `${counts.overview} overview · ${counts.releases} releases · ${counts.sprints} sprints · ${counts.tasks} tasks · ${counts.resources} resources`;
    }},
    {key:"action",header:"Action",mobilePriority:"action",cell:template=>
      <Link href={"/college/projects/templates/"+template.templateId}
        className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">View template</Link>},
  ];
  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath="/college/projects"
        active="templates"
      />
      <PageHeader
        eyebrow="Projects"
        title="Project templates"
        description="Published project templates assigned to this college."
      />
      <form action="/college/projects/templates" method="get" role="search"
        className="flex flex-wrap items-end gap-3">
        <label className="min-w-52 flex-1 text-sm font-semibold text-foreground">
          Search templates
          <Input type="search" name="q" maxLength={120} defaultValue={q}
            placeholder="Search by template or version"
            className="mt-1" />
        </label>
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {q ? <Link href="/college/projects/templates" className="py-2 text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-11 inline-flex items-center">
          Clear search
        </Link> : null}

      </form>
      <ListToolbar label="Assigned project templates" viewCount={visible.length}
        exportAction={<ProjectTemplateCatalogueExport rows={rows} />} />
      {q ? <p role="status" className="text-sm text-body">{visible.length} of {templates.length} templates</p> : null}
      <DataTable caption="Assigned project templates" columns={columns} rows={visible}
        getRowKey={template=>template.assignmentId}
        empty={<div role="status" className="space-y-3 text-sm text-body">
          <p>{templates.length===0?"No project templates are currently assigned to this college.":"No project templates match this search."}</p>
          {q?<Link href="/college/projects/templates"
            className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear search</Link>:null}
        </div>} />
    </div>
  );
}
