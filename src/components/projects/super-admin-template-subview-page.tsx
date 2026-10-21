import Link from "next/link";
import { notFound } from "next/navigation";
import {desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectTemplateLegacyEvents} from "@/db/schema";

import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { getSuperAdminTemplateVersionHistory } from "@/modules/projects/template-version-history-service";
import { templateVersionHistoryQuerySchema, templateVersionHistoryHref, type templateVersionHistoryPage } from "@/modules/projects/template-version-history-model";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/ui/pagination";
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
      <dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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
  let historyLoadFailed=false;
  if (section === "versions" && !templateVersionHistoryQuerySchema.safeParse(historyQuery).success) {
    return <ErrorState title="Invalid version page" description="Choose a valid positive page number."
      action={<Link href={templateVersionHistoryHref(templateId, 1)}>First page</Link>} />;
  }
  try {
    detail=await getSuperAdminTemplateSubview(context,templateId,section==="colleges");
    if(section==="versions"){
      try{
        const history=await getSuperAdminTemplateVersionHistory(context,templateId,historyQuery);
        detail=history.detail;
        historyPaging=history.paging;
      }catch{
        historyLoadFailed=true;
      }
    }
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
    return <div className="min-w-0 space-y-[var(--lms-space-5)]">
      <ProjectAdminNav basePath="/admin/projects" active="templates"/>
      <PageHeader title="Template section"/>
      <ErrorState title="Failed to load template"
        description="Template could not be loaded. Review your access and try again."
        action={<Link href={"/admin/projects/templates/"+encodeURIComponent(templateId)+"/"+section}
          className="font-semibold text-primary-text">Retry</Link>}/>
    </div>;
  }

  const legacyEvents = section==="versions" && !historyLoadFailed
    ? await getDb().select({
        id:projectTemplateLegacyEvents.id,
        legacyEventId:projectTemplateLegacyEvents.legacyEventId,
        legacyTemplateVersion:projectTemplateLegacyEvents.legacyTemplateVersion,
        actionType:projectTemplateLegacyEvents.actionType,
        notes:projectTemplateLegacyEvents.notes,
        changedAt:projectTemplateLegacyEvents.changedAt,
        snapshot:projectTemplateLegacyEvents.snapshot,
      }).from(projectTemplateLegacyEvents)
        .where(eq(projectTemplateLegacyEvents.templateId,templateId))
        .orderBy(desc(projectTemplateLegacyEvents.changedAt),desc(projectTemplateLegacyEvents.id))
        .limit(100)
    : [];

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
    <div className="min-w-0 space-y-4">
      <ProjectAdminNav
        basePath="/admin/projects"
        active="templates"
      />

      <PageBackLink href="/admin/projects/templates" label="Template catalogue" />
      <PageHeader
        title={detail.template.title}
        description={
          detail.template.summary ??
          "Read-only global project template details."
        }
        actions={
          <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {detail.template.status === "PUBLISHED" ? (
              <Link href={"/admin/projects/workspaces/new?templateId=" + encodeURIComponent(detail.template.id)}
                className="inline-flex min-h-11 items-center justify-center text-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-3.5 text-sm font-[650] text-[var(--lms-on-primary)] hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
                Use this template · Create workspace →
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="flex min-w-0 flex-wrap items-center gap-2"><StatusBadge tone={detail.template.status==="PUBLISHED"?"success":detail.template.status==="ARCHIVED"?"neutral":"warning"}>{detail.template.status}</StatusBadge><StatusBadge>Current version {detail.template.currentVersion}</StatusBadge></div>
      <SuperAdminTemplateTabs
        templateId={detail.template.id}
        active={section}
        counts={blueprint ? {
          sprints:sprints.length,
          tasks:tasks.length,
          resources:resources.length,
        } : undefined}
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
      <p className="m-0 text-xs text-muted-foreground leading-[20px]">
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
            className="min-w-0 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">
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
                  className="min-w-0 border-b border-border py-4 last:border-b-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="m-0 break-words text-base font-semibold text-foreground">
                        {sprint.title}
                      </h3>
                      <p className="mt-1 break-all text-xs text-muted-foreground leading-[20px]">
                        Key: {sprint.key}
                      </p>
                    </div>
                    <StatusBadge>
                      Sequence {sprint.sequence}
                    </StatusBadge>
                  </div>

                  <dl className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
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

                  <p className="mt-4 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">
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
            className="min-w-0 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">
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
                  className="min-w-0 border-b border-border py-4 last:border-b-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="m-0 break-words text-base font-semibold text-foreground">
                        {task.title}
                      </h3>
                      <p className="mt-1 break-all text-xs text-muted-foreground leading-[20px]">
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

                  <dl className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
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
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">
                        {task.description}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground">
                      Acceptance criteria
                    </h4>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">
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
              <h2 className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">
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
                  className="min-w-0 border-b border-border py-4 last:border-b-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="m-0 break-words text-base font-semibold text-foreground">
                        {resource.title}
                      </h3>
                      <p className="mt-1 break-all text-xs text-muted-foreground leading-[20px]">
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
                    <p className="mt-4 whitespace-pre-wrap text-sm text-body leading-[22px]">
                      {resource.description}
                    </p>
                  ) : null}

                  {resource.url ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex min-h-11 md:min-h-9 items-center break-all text-sm font-semibold text-primary-text hover:underline"
                    >
                      Open resource →
                    </a>
                  ) : (
                    <p className="mt-4 text-xs text-muted-foreground leading-[20px]">
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
              <h2 className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">
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
                  <p className="mt-1 text-xs text-muted-foreground leading-[20px]">{assignment.collegeCode}</p>
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
              empty={<EmptyState title="No active assignments" description="No active college assignments." />}
            />
          </section>
        )
      ) : null}

      {section === "versions" ? (
        historyLoadFailed ? (
          <ErrorState title="Failed to load version history"
            description="Template details are available, but the version history could not be loaded."
            action={<Link href={templateVersionHistoryHref(templateId,1)} className="font-semibold text-primary-text">Retry version history</Link>}/>
        ) : detail.versions.length === 0 ? (
          <NoItems
            title="No version history"
            description="No version records are available for this template."
          />
        ) : (
          <section
            aria-label="Template version history"
            className="min-w-0 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">
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
                  className="min-w-0 border-b border-border py-4 last:border-b-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="m-0 break-words text-base font-semibold text-foreground">
                        Version {version.version} ·{" "}
                        {version.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground leading-[20px]">
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
                    className="mt-3 inline-flex min-h-11 items-center break-words text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    Compare changes and inspect snapshot →
                  </Link>

                  {version.summary ? (
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">
                      {version.summary}
                    </p>
                  ) : null}

                  <p className="mt-3 break-words text-sm text-body leading-[22px]">
                    {version.changeNote ||
                      "No change note recorded."}
                  </p>

                  <dl className="mt-4 grid gap-3 min-[768px]:grid-cols-2 min-[992px]:grid-cols-3">
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
            {legacyEvents.length>0?<section aria-label="Legacy template history" className="mt-5 space-y-3">
              <h3 className="text-[16px] font-semibold">Legacy version events</h3>
              <p className="text-sm text-muted-foreground">Historic actions retain their original version number, action type and source snapshot. They are not editable vNext blueprint versions.</p>
              {legacyEvents.map(event=><details key={event.id} className="border-b border-border py-3">
                <summary className="cursor-pointer font-semibold">
                  Version {event.legacyTemplateVersion??"—"} · {event.actionType??"Updated"} · {event.changedAt?formatDate(event.changedAt):"Date unavailable"}
                </summary>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  <DetailField label="Legacy event ID" value={event.legacyEventId??"—"}/>
                  <DetailField label="Action" value={event.actionType??"Unknown"}/>
                  <DetailField label="Notes" value={event.notes??"No notes recorded."}/>
                </dl>
                {event.snapshot?<pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded border border-border p-3 text-xs">{JSON.stringify(event.snapshot,null,2)}</pre>:null}
              </details>)}
            </section>:null}
            {historyPaging ? <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <span className="text-xs text-muted-foreground">25 versions per page</span>
              <Pagination label="Template version pages" page={historyPaging.page}
                pageCount={historyPaging.totalPages}
                hrefForPage={page=>templateVersionHistoryHref(templateId,page)}/>
            </div> : null}
          </section>
        )
      ) : null}
    </div>
  );
}
