import Link from "next/link";
import {ProjectAdminMissingCollege} from "@/components/projects/project-admin-missing-college";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";
import { ProjectTemplateCatalogueExport } from "@/components/projects/project-template-catalogue-export";
import { projectTemplateSectionCounts } from "@/modules/projects/project-template-catalogue-model";

export default async function CollegeProjectTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  const collegeId = context.membership?.collegeId;
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
          <input type="search" name="q" maxLength={120} defaultValue={q}
            placeholder="Search by template or version"
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-normal" />
        </label>
        <button type="submit" className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold">
          Search
        </button>
        {q ? <Link href="/college/projects/templates" className="py-2 text-sm text-primary-text underline">
          Clear search
        </Link> : null}
        <ProjectTemplateCatalogueExport rows={rows} />
      </form>
      {q ? <p role="status" className="text-sm text-body">{visible.length} of {templates.length} templates</p> : null}
      {!templates.length ? (
        <section className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
          No project templates are currently assigned to this college.
        </section>
      ) : !visible.length ? (
        <p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
          No project templates match this search.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted"><tr>
              <th scope="col" className="p-3">Template</th>
              <th scope="col" className="p-3">Version</th>
              <th scope="col" className="p-3">Sections</th>
              <th scope="col" className="p-3">Action</th>
            </tr></thead>
            <tbody>
          {visible.map((template) => (
            <tr key={template.assignmentId} className="border-t border-border">
              <td className="p-3">
                <p className="font-semibold">{template.title}</p>
                {template.summary ? <p className="mt-1 max-w-lg text-xs text-muted-foreground">{template.summary}</p> : null}
              </td>
              <td className="p-3"><StatusBadge tone="success">Version {template.version}</StatusBadge></td>
              <td className="p-3">
                {(() => {
                  const counts = projectTemplateSectionCounts(template.blueprint);
                  return `${counts.overview} overview · ${counts.releases} releases · ${counts.sprints} sprints · ${counts.tasks} tasks · ${counts.resources} resources`;
                })()}
              </td>
              <td className="p-3">
                <Link href={"/college/projects/templates/" + template.templateId}
                  className="font-semibold text-primary-text underline">View template</Link>
              </td>
            </tr>
          ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
