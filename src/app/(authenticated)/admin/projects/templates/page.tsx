import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { StatusBadge } from "@/components/ui/status-badge";
import { listProjectTemplates } from "@/modules/projects/template-service";

function tone(status: string) {
  return status === "PUBLISHED"
    ? "success" as const
    : status === "ARCHIVED"
      ? "neutral" as const
      : "warning" as const;
}

export default async function SuperAdminProjectTemplatesPage() {
  const context = await getCurrentRequestContext();
  const templates =
    await listProjectTemplates(context);

  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath="/admin/projects"
        active="templates"
      />
      <PageHeader
        eyebrow="Projects"
        title="Template catalogue"
        description="Global project templates and their current publication state."
      />
      {!templates.length ? (
        <section className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
          No project templates exist yet.
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {templates.map((template) => (
            <article
              key={template.id}
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
                <StatusBadge tone={tone(template.status)}>
                  {template.status}
                </StatusBadge>
              </div>
              {template.summary ? (
                <p className="mt-3 text-sm leading-6 text-body">
                  {template.summary}
                </p>
              ) : null}
              <p className="mt-3 text-xs text-muted-foreground">
                Current version {template.currentVersion}
                {template.publishedVersion
                  ? " · published " +
                    template.publishedVersion
                  : " · not published"}
              </p>
              <Link
                href={
                  "/admin/projects/templates/" +
                  template.id
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
