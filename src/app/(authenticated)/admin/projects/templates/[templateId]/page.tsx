import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { ProjectTemplateView } from "@/components/projects/project-template-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { getProjectTemplateDetail } from "@/modules/projects/template-service";

export default async function SuperAdminProjectTemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { templateId } = await params;
  const detail =
    await getProjectTemplateDetail(
      context,
      templateId,
    );

  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath="/admin/projects"
        active="templates"
      />
      <Link
        href="/admin/projects/templates"
        className="inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
      >
        ← Template catalogue
      </Link>
      <PageHeader
        eyebrow="Global Project Template"
        title={detail.template.title}
        description={
          detail.template.summary ??
          "Global project template."
        }
        actions={
          <StatusBadge
            tone={
              detail.template.status === "PUBLISHED"
                ? "success"
                : detail.template.status === "ARCHIVED"
                  ? "neutral"
                  : "warning"
            }
          >
            {detail.template.status}
          </StatusBadge>
        }
      />
      {detail.currentVersion ? (
        <ProjectTemplateView
          blueprint={detail.currentVersion.blueprint}
        />
      ) : (
        <section className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
          The current template version could not be resolved.
        </section>
      )}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Version history
        </h2>
        <div className="mt-3 space-y-2">
          {detail.versions.map((version) => (
            <div
              key={version.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted px-3 py-2"
            >
              <div>
                <p className="m-0 text-sm font-semibold text-foreground">
                  Version {version.version} · {version.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {version.changeNote ||
                    "No change note recorded."}
                </p>
              </div>
              {detail.template.publishedVersion ===
              version.version ? (
                <StatusBadge tone="success">
                  Published
                </StatusBadge>
              ) : null}
            </div>
          ))}
        </div>
        <p className="mb-0 mt-4 text-xs text-muted-foreground">
          Active college assignments: {detail.assignments.length}
        </p>
      </section>
    </div>
  );
}
