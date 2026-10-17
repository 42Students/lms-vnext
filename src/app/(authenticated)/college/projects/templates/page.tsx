import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";

export default async function CollegeProjectTemplatesPage() {
  const context = await getCurrentRequestContext();
  const collegeId = context.membership?.collegeId;
  if (!collegeId) notFound();

  const templates =
    await listAssignedProjectTemplates(
      context,
      collegeId,
    );

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
      {!templates.length ? (
        <section className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
          No project templates are currently assigned to this college.
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {templates.map((template) => (
            <article
              key={template.assignmentId}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="m-0 text-lg font-semibold text-foreground">
                    {template.title}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {template.slug}
                  </p>
                </div>
                <StatusBadge tone="success">
                  Version {template.version}
                </StatusBadge>
              </div>
              {template.summary ? (
                <p className="mt-3 text-sm leading-6 text-body">
                  {template.summary}
                </p>
              ) : null}
              <Link
                href={
                  "/college/projects/templates/" +
                  template.templateId
                }
                className="mt-4 inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
              >
                View template →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
