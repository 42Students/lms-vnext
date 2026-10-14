import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { SuperAdminTemplateTabs } from "@/components/projects/super-admin-template-tabs";
import { ProjectsServiceError } from "@/modules/projects/errors";
import {
  getSuperAdminTemplateSubview,
} from "@/modules/projects/template-subview-service";
import {
  countTemplateBlueprintItems,
  templateVersionLabels,
  TEMPLATE_SUBVIEW_TABS,
  type TemplateReadSubview,
} from "@/modules/projects/template-subview-model";
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
}: {
  templateId: string;
  section: TemplateReadSubview;
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

  try {
    detail =
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

    throw error;
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
        className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:text-primary-hover"
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

      <p className="m-0 text-xs leading-5 text-muted-foreground">
        This section is read-only. Sprints, tasks and resources
        below reflect the current template version.
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
                  className="rounded-xl border border-border bg-surface p-5"
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
                  </dl>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-body">
                    {sprint.description ||
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
                  className="rounded-xl border border-border bg-surface p-5"
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
                  className="rounded-xl border border-border bg-surface p-5"
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
                      className="mt-4 inline-flex min-h-10 items-center break-all text-sm font-semibold text-primary-text hover:underline"
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

            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-muted text-body">
                  <tr>
                    <th
                      scope="col"
                      className="border-b border-border px-4 py-3"
                    >
                      College
                    </th>
                    <th
                      scope="col"
                      className="border-b border-border px-4 py-3"
                    >
                      College status
                    </th>
                    <th
                      scope="col"
                      className="border-b border-border px-4 py-3"
                    >
                      Assigned version
                    </th>
                    <th
                      scope="col"
                      className="border-b border-border px-4 py-3"
                    >
                      Assigned on
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detail.assignedColleges.map(
                    (assignment) => (
                      <tr
                        key={assignment.assignmentId}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 align-top">
                          <p className="m-0 font-semibold text-foreground">
                            {assignment.collegeName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {assignment.collegeCode}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <StatusBadge
                            tone={
                              assignment.collegeStatus ===
                              "ACTIVE"
                                ? "success"
                                : "neutral"
                            }
                          >
                            {assignment.collegeStatus}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 align-top">
                          {assignment.assignedVersion ??
                            "Unresolved"}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <time
                            dateTime={assignment.assignedAt.toISOString()}
                          >
                            {formatDate(
                              assignment.assignedAt,
                            )}
                          </time>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
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
                {detail.versions.length} versions
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
                  className="rounded-xl border border-border bg-surface p-5"
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
          </section>
        )
      ) : null}
    </div>
  );
}
