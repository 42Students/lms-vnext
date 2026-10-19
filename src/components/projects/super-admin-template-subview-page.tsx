import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { getSuperAdminTemplateVersionHistory } from "@/modules/projects/template-version-history-service";
import { templateVersionHistoryQuerySchema, templateVersionHistoryHref, type templateVersionHistoryPage } from "@/modules/projects/template-version-history-model";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { SuperAdminTemplateTabs } from "@/components/projects/super-admin-template-tabs";
import { SuperAdminTemplatePlanEditor } from "@/components/projects/super-admin-template-plan-editor";
import {SuperAdminTemplateResourceEditor} from "@/components/projects/super-admin-template-resource-editor";
import {SuperAdminTemplateOverviewEditor} from "@/components/projects/super-admin-template-overview-editor";
import { can } from "@/modules/permissions/policy";
import { ProjectsServiceError } from "@/modules/projects/errors";
import {
  getSuperAdminTemplateSubview,
} from "@/modules/projects/template-subview-service";
import {
  countTemplateBlueprintItems,
  templateVersionLabels,
  TEMPLATE_SUBVIEW_TABS,
  type TemplateSubview,
} from "@/modules/projects/template-subview-model";
import { templateVersionComparisonHref } from "@/modules/projects/template-version-comparison-model";
import { projectTemplateIdSchema } from "@/modules/projects/validation";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", dateStyle: "medium",
  }).format(value) + " IST";
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-body">
        {value}
      </dd>
    </div>
  );
}

function NoItems({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
    />
  );
}

export async function SuperAdminTemplateSubviewPage({
  templateId,
  section,
  historyQuery = {},
}: {
  templateId: string;
  section: TemplateSubview;
  historyQuery?: unknown;
}) {
  const context =
    await getCurrentRequestContext();

  if (
    !projectTemplateIdSchema.safeParse(
      templateId,
    ).success
  ) {
    notFound();
  }

  let detail: Awaited<
    ReturnType<typeof getSuperAdminTemplateSubview>
  >;

  let historyPaging: ReturnType<typeof templateVersionHistoryPage> | null = null;
  if (section === "versions" && !templateVersionHistoryQuerySchema.safeParse(historyQuery).success) {
    return <ErrorState title="Invalid version page" description="Choose a valid positive page number."
      action={<Link href={templateVersionHistoryHref(templateId, 1)}>First page</Link>} />;
  }
  try {
    if (section === "versions") {
      const history = await getSuperAdminTemplateVersionHistory(context, templateId, historyQuery);
      detail = history.detail;
      historyPaging = history.paging;
    } else detail =
      await getSuperAdminTemplateSubview(
        context,
        templateId,
        section === "colleges",
      );
  } catch (error) {
    if (
      error instanceof ProjectsServiceError &&
      error.code === "PROJECT_TEMPLATE_NOT_FOUND"
    ) {
      notFound();
    }

    // Data-layer outages and an expired/revoked permission must not crash a
    // template subview or accidentally present an empty global template.
    // The retry points back to the same authorized route, without exposing
    // exception text or version JSON to an unverified viewer.
    return <div className="min-w-0 space-y-5">
      <ProjectAdminNav basePath="/admin/projects" active="templates"/>
      <PageHeader eyebrow="Super Admin · Projects" title="Template section"/>
      <ErrorState title="Template section unavailable"
        description="Template details could not be loaded. No version or college assignment data is shown."
        action={<Link href={"/admin/projects/templates/"+encodeURIComponent(templateId)+"/"+section}
          className="font-semibold text-primary-text">Retry template section</Link>}/>
    </div>;
  }

  const sectionTitle =
    TEMPLATE_SUBVIEW_TABS.find(
      (tab) => tab.id === section,
    )?.label ?? "Template";

  const currentVersion =
    detail.currentVersion;

  const blueprint =
    currentVersion?.blueprint ?? null;

  const releases =
    blueprint?.releases ?? [];

  const sprints =
    blueprint?.sprints ?? [];

  const tasks =
    blueprint?.tasks ?? [];

  const resources =
    blueprint?.resources ?? [];

  const releaseNames = new Map(
    releases.map((release) => [
      release.key,
      release.title,
    ]),
  );

  const sprintNames = new Map(
    sprints.map((sprint) => [
      sprint.key,
      sprint.title,
    ]),
  );

  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath="/admin/projects"
        active="templates"
      />

      <Link
        href="/admin/projects/templates"
        className="inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text hover:text-primary-hover"
      >
        ← Template catalogue
      </Link>

      <PageHeader
        eyebrow={`Super Admin · Project Template · ${sectionTitle}`}
        title={detail.template.title}
        description={
          detail.template.summary ??
          "Read-only global project template details."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/projects/templates"
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">
              ← Template catalogue
            </Link>
            {detail.template.status === "PUBLISHED" ? (
              <Link href={"/admin/projects/workspaces/new?templateId=" + encodeURIComponent(detail.template.id)}
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-primary px-3.5 text-sm font-semibold text-on-primary hover:bg-primary-hover sm:min-h-9">
                Use this template · Create workspace →
              </Link>
            ) : null}
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

            <StatusBadge>
              Current version{" "}
              {detail.template.currentVersion}
            </StatusBadge>
          </div>
        }
      />

      <SuperAdminTemplateTabs
        templateId={detail.template.id}
        active={section}
      />

      {blueprint && (section === "sprints" || section === "tasks") &&
        can(context, "project-template.manage") && detail.template.status !== "ARCHIVED" ? (
        <SuperAdminTemplatePlanEditor key={currentVersion?.version}
          templateId={detail.template.id}
          templateTitle={detail.template.title}
          templateSummary={detail.template.summary}
          currentVersion={detail.template.currentVersion}
          blueprint={blueprint}
          section={section} />
      ) : null}
      {blueprint&&section==="overview"&&can(context,"project-template.manage")&&
        detail.template.status!=="ARCHIVED"?<SuperAdminTemplateOverviewEditor
         key={currentVersion?.version} templateId={detail.template.id}
         title={detail.template.title} summary={detail.template.summary}
         version={detail.template.currentVersion} blueprint={blueprint}/>:null}
      {blueprint&&section==="resources"&&can(context,"project-template.manage")&&
        detail.template.status!=="ARCHIVED"?<SuperAdminTemplateResourceEditor
          key={currentVersion?.version} templateId={detail.template.id}
          title={detail.template.title} summary={detail.template.summary}
          currentVersion={detail.template.currentVersion} blueprint={blueprint}/>:null}
      <p className="m-0 text-xs leading-5 text-muted-foreground">
        The sections below reflect the current template version.
        Published and college-assigned versions may differ.
      </p>

      {section === "sprints" ? (
        !currentVersion ? (
          <NoItems
            title="Current version unavailable"
            description="The template's current version could not be resolved, so its sprints cannot be displayed."
          />
        ) : sprints.length === 0 ? (
          <NoItems
            title="No sprints configured"
            description="The current template version has no recorded sprints."
          />
        ) : (
          <section
            aria-label="Template sprints"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 text-lg font-semibold text-foreground">
                Sprints
              </h2>
              <StatusBadge>
                {sprints.length} total
              </StatusBadge>
            </div>

            {sprints
              .slice()
              .sort(
                (a, b) =>
                  a.releaseKey.localeCompare(
                    b.releaseKey,
                  ) ||
                  a.sequence - b.sequence ||
                  a.key.localeCompare(b.key),
              )
              .map((sprint) => (
                <article
                  key={sprint.key}
                  className="border-b border-border py-5 last:border-b-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="m-0 text-base font-semibold text-foreground">
                        {sprint.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Key: {sprint.key}
                      </p>
                    </div>
                    <StatusBadge>
                      Sequence {sprint.sequence}
                    </StatusBadge>
                  </div>

                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <DetailField
                      label="Release"
                      value={
                        releaseNames.get(
                          sprint.releaseKey,
                        ) ??
                        sprint.releaseKey
                      }
                    />
                    <DetailField
                      label="Release key"
                      value={sprint.releaseKey}
                    />
                    <DetailField label="Due" value={sprint.dueLabel ?? "Not set"} />
                  </dl>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-body">
                    {sprint.goal || sprint.description ||
                      "No sprint description recorded."}
                  </p>
                </article>
              ))}
          </section>
        )
      ) : null}

      {section === "tasks" ? (
        !currentVersion ? (
          <NoItems
            title="Current version unavailable"
            description="The template's current version could not be resolved, so its tasks cannot be displayed."
          />
        ) : tasks.length === 0 ? (
          <NoItems
            title="No tasks configured"
            description="The current template version has no recorded tasks."
          />
        ) : (
          <section
            aria-label="Template tasks"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 text-lg font-semibold text-foreground">
                Tasks
              </h2>
              <StatusBadge>
                {tasks.length} total
              </StatusBadge>
            </div>

            {tasks
              .slice()
              .sort(
                (a, b) =>
                  a.sprintKey.localeCompare(
                    b.sprintKey,
                  ) ||
                  a.sequence - b.sequence ||
                  a.key.localeCompare(b.key),
              )
              .map((task) => (
                <article
                  key={task.key}
                  className="border-b border-border py-5 last:border-b-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="m-0 text-base font-semibold text-foreground">
                        {task.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Key: {task.key}
                      </p>
                    </div>
                    <StatusBadge
                      tone={
                        task.priority === "HIGH" ||
                        task.priority === "CRITICAL"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {task.priority}
                    </StatusBadge>
                  </div>

                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <DetailField
                      label="Sprint"
                      value={
                        sprintNames.get(
                          task.sprintKey,
                        ) ?? task.sprintKey
                      }
                    />
                    <DetailField
                      label="Sprint key"
                      value={task.sprintKey}
                    />
                    <DetailField
                      label="Sequence"
                      value={task.sequence}
                    />
                    <DetailField label="Estimate (points)" value={task.estimatePoints ?? "Not set"} />
                  </dl>

                  {task.description ? (
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-muted-foreground">
                        Description
                      </h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-body">
                        {task.description}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground">
                      Acceptance criteria
                    </h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-body">
                      {task.acceptanceCriteria ||
                        "No acceptance criteria recorded."}
                    </p>
                  </div>
                </article>
              ))}
          </section>
        )
      ) : null}

      {section === "resources" ? (
        !currentVersion ? (
          <NoItems
            title="Current version unavailable"
            description="The template's current version could not be resolved, so its resources cannot be displayed."
          />
        ) : resources.length === 0 ? (
          <NoItems
            title="No resources configured"
            description="The current template version has no recorded resources."
          />
        ) : (
          <section
            aria-label="Template resources"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 text-lg font-semibold text-foreground">
                Resources
              </h2>
              <StatusBadge>
                {resources.length} total
              </StatusBadge>
            </div>

            {resources
              .slice()
              .sort(
                (a, b) =>
                  a.sequence - b.sequence ||
                  a.key.localeCompare(b.key),
              )
              .map((resource) => (
                <article
                  key={resource.key}
                  className="border-b border-border py-5 last:border-b-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="m-0 text-base font-semibold text-foreground">
                        {resource.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Key: {resource.key}
                      </p>
                    </div>
                    <StatusBadge
                      tone={
                        resource.required
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {resource.required
                        ? "Required"
                        : "Optional"}
                    </StatusBadge>
                  </div>

                  <dl className="mt-4">
                    <DetailField
                      label="Sequence"
                      value={resource.sequence}
                    />
                  </dl>

                  {resource.description ? (
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-body">
                      {resource.description}
                    </p>
                  ) : null}

                  {resource.url ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex min-h-11 sm:min-h-9 items-center break-all text-sm font-semibold text-primary-text hover:underline"
                    >
                      Open resource →
                    </a>
                  ) : (
                    <p className="mt-4 text-xs text-muted-foreground">
                      No resource URL recorded.
                    </p>
                  )}
                </article>
              ))}
          </section>
        )
      ) : null}

      {section === "colleges" ? (
        detail.assignedColleges.length === 0 ? (
          <NoItems
            title="No active college assignments"
            description="This template has no currently active college assignments. Revoked assignments are excluded."
          />
        ) : (
          <section
            aria-label="Assigned colleges"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 text-lg font-semibold text-foreground">
                Active college assignments
              </h2>
              <StatusBadge>
                {detail.assignedColleges.length}
              </StatusBadge>
            </div>

            <DataTable
              caption="Project template records"
              rows={detail.assignedColleges}
              getRowKey={assignment=>assignment.assignmentId}
              columns={[
                {key:"college",header:"College",mobilePriority:"primary",cell:assignment=><>
                  <p className="m-0 font-semibold text-foreground">{assignment.collegeName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{assignment.collegeCode}</p>
                </>},
                {key:"status",header:"College status",mobilePriority:"secondary",cell:assignment=>
                  <StatusBadge tone={assignment.collegeStatus==="ACTIVE"?"success":"neutral"}>
                    {assignment.collegeStatus}
                  </StatusBadge>},
                {key:"version",header:"Assigned version",mobilePriority:"secondary",cell:assignment=>
                  assignment.assignedVersion??"Unresolved"},
                {key:"assigned",header:"Assigned on",mobilePriority:"secondary",cell:assignment=>
                  <time dateTime={assignment.assignedAt.toISOString()}>{formatDate(assignment.assignedAt)}</time>},
              ]}
              empty={<p className="text-sm text-body">No active college assignments.</p>}
            />
          </section>
        )
      ) : null}

      {section === "versions" ? (
        detail.versions.length === 0 ? (
          <NoItems
            title="No version history"
            description="No version records are available for this template."
          />
        ) : (
          <section
            aria-label="Template version history"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 text-lg font-semibold text-foreground">
                Version history
              </h2>
              <StatusBadge>
                {historyPaging?.total ?? detail.versions.length} versions
              </StatusBadge>
            </div>

            {detail.versions.map((version) => {
              const labels =
                templateVersionLabels(
                  version.version,
                  detail.template.currentVersion,
                  detail.template.publishedVersion,
                );

              const counts =
                countTemplateBlueprintItems(
                  version.blueprint,
                );

              return (
                <article
                  key={version.id}
                  className="border-b border-border py-5 last:border-b-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="m-0 text-base font-semibold text-foreground">
                        Version {version.version} ·{" "}
                        {version.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Created{" "}
                        <time
                          dateTime={version.createdAt.toISOString()}
                        >
                          {formatDate(
                            version.createdAt,
                          )}
                        </time>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {labels.map((label) => (
                        <StatusBadge
                          key={label}
                          tone={
                            label === "Published"
                              ? "success"
                              : "info"
                          }
                        >
                          {label}
                        </StatusBadge>
                      ))}
                    </div>
                  </div>

                  <Link href={templateVersionComparisonHref(detail.template.id, version.id)}
                    className="mt-3 inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text">
                    Compare changes and inspect snapshot →
                  </Link>

                  {version.summary ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">
                      {version.summary}
                    </p>
                  ) : null}

                  <p className="mt-3 text-sm text-body">
                    {version.changeNote ||
                      "No change note recorded."}
                  </p>

                  <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailField
                      label="Releases"
                      value={counts.releases}
                    />
                    <DetailField
                      label="Sprints"
                      value={counts.sprints}
                    />
                    <DetailField
                      label="Tasks"
                      value={counts.tasks}
                    />
                    <DetailField
                      label="Resources"
                      value={counts.resources}
                    />
                  </dl>
                </article>
              );
            })}
            {historyPaging ? <nav aria-label="Template version pages" className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-muted-foreground">Page {historyPaging.page} of {historyPaging.totalPages} · 25 per page</span>
              {historyPaging.page > 1 ? <Link className="inline-flex min-h-11 sm:min-h-9 items-center font-semibold text-primary-text"
                href={templateVersionHistoryHref(templateId, historyPaging.page - 1)}>Previous</Link> : null}
              {historyPaging.page < historyPaging.totalPages ? <Link className="inline-flex min-h-11 sm:min-h-9 items-center font-semibold text-primary-text"
                href={templateVersionHistoryHref(templateId, historyPaging.page + 1)}>Next</Link> : null}
            </nav> : null}
          </section>
        )
      ) : null}
    </div>
  );
}
