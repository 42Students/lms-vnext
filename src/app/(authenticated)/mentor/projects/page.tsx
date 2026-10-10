import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { MentorProjectsUnavailable } from "@/components/projects/mentor-projects-unavailable";
import {
  ProjectParticipantListControls,
  ProjectParticipantPagination,
  type ProjectParticipantListQuery,
} from "@/components/projects/project-participant-list-controls";
import { ProjectList } from "@/components/projects/project-list";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { listMyMentorProjectAttention } from "@/modules/projects/mentor-attention-service";
import { listMyProjectInstances } from "@/modules/projects/member-service";

function one(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function pageSize(
  value: string | undefined,
) {
  const parsed = Number(value);
  return parsed === 50 ||
    parsed === 100
    ? parsed
    : 25;
}

function pageNumber(
  value: string | undefined,
) {
  const parsed = Number(value);
  return Number.isInteger(parsed) &&
    parsed > 0
    ? parsed
    : 1;
}

export default async function MentorProjectsPage({
  searchParams,
}: {
  searchParams: Promise<
    Record<
      string,
      string | string[] | undefined
    >
  >;
}) {
  const context =
    await getCurrentRequestContext();
  if (
    !hasMembershipRole(
      context,
      "MENTOR",
    )
  ) {
    redirect("/dashboard");
  }

  const available =
    await resolveOptionalModuleAccess(
      context,
    ).catch(() => null);
  if (
    available?.projects.enabled !== true
  ) {
    return <MentorProjectsUnavailable />;
  }

  const params = await searchParams;
  const status =
    one(params.status);
  const attention =
    one(params.attention);
  const query: ProjectParticipantListQuery = {
    search:
      one(params.search)?.trim() ||
      undefined,
    status:
      status === "CURRENT" ||
      status === "PLANNED" ||
      status === "ACTIVE" ||
      status === "COMPLETED" ||
      status === "ARCHIVED"
        ? status
        : undefined,
    attention:
      attention === "MENTOR_REVIEW"
        ? attention
        : undefined,
    page: pageNumber(
      one(params.page),
    ),
    pageSize: pageSize(
      one(params.pageSize),
    ),
  };

  const [allRows, attentionRows] =
    await Promise.all([
      listMyProjectInstances(
        context,
      ),
      listMyMentorProjectAttention(
        context,
      ),
    ]);

  const alerts = new Map<
    string,
    Set<string>
  >();
  const kinds = new Map<
    string,
    Set<string>
  >();
  for (const item of attentionRows) {
    const labels =
      alerts.get(item.projectId) ??
      new Set<string>();
    const projectKinds =
      kinds.get(item.projectId) ??
      new Set<string>();

    projectKinds.add(item.kind);
    if (item.kind === "REVIEW") {
      labels.add("Needs review");
    } else if (
      item.kind === "STALLED"
    ) {
      labels.add("Stalled");
    } else if (
      item.kind === "REQUESTED"
    ) {
      labels.add("Meeting request");
    } else if (
      item.kind === "MEETING_SOON"
    ) {
      labels.add("Meeting soon");
    }

    alerts.set(
      item.projectId,
      labels,
    );
    kinds.set(
      item.projectId,
      projectKinds,
    );
  }

  const normalizedSearch =
    query.search?.toLowerCase();
  const filtered = allRows
    .filter(
      (row) =>
        row.memberRole === "MENTOR",
    )
    .filter((row) => {
      if (!normalizedSearch) {
        return true;
      }
      return [
        row.project.title,
        row.project.slug,
        row.project.summary ?? "",
      ].some((value) =>
        value
          .toLowerCase()
          .includes(
            normalizedSearch,
          ),
      );
    })
    .filter((row) => {
      if (!query.status) {
        return true;
      }
      if (
        query.status === "CURRENT"
      ) {
        return (
          row.project.status !==
            "ARCHIVED" &&
          row.project.status !==
            "COMPLETED"
        );
      }
      return (
        row.project.status ===
        query.status
      );
    })
    .filter((row) => {
      if (
        query.attention !==
        "MENTOR_REVIEW"
      ) {
        return true;
      }
      return (
        kinds
          .get(row.project.id)
          ?.has("REVIEW") ?? false
      );
    })
    .sort((a, b) => {
      const archivedOrder =
        Number(
          a.project.status ===
            "ARCHIVED",
        ) -
        Number(
          b.project.status ===
            "ARCHIVED",
        );
      if (archivedOrder) {
        return archivedOrder;
      }
      return (
        b.project.updatedAt.getTime() -
          a.project.updatedAt.getTime() ||
        a.project.title.localeCompare(
          b.project.title,
        )
      );
    });

  const total = filtered.length;
  const totalPages = Math.max(
    1,
    Math.ceil(
      total /
        (query.pageSize ?? 25),
    ),
  );
  const page = Math.min(
    query.page ?? 1,
    totalPages,
  );
  const start =
    (page - 1) *
    (query.pageSize ?? 25);
  const rows = filtered.slice(
    start,
    start +
      (query.pageSize ?? 25),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mentor"
        title="Mentoring Projects"
        description="Projects where you are responsible for execution guidance, review and final evaluation."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/mentor/calendar"
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary-text"
            >
              Meetings
            </Link>
            <Link
              href="/mentor/notifications"
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary-text"
            >
              Notifications
            </Link>
          </div>
        }
      />

      <ProjectParticipantListControls
        basePath="/mentor/projects"
        query={{
          ...query,
          page,
        }}
        mentor
      />

      <ProjectList
        items={rows.map((row) => {
          const projectAlerts =
            [...(
              alerts.get(
                row.project.id,
              ) ?? []
            )];
          const projectKinds =
            kinds.get(
              row.project.id,
            );
          const directTab =
            projectKinds?.has("REVIEW")
              ? "delivery"
              : projectKinds?.has(
                    "REQUESTED",
                  ) ||
                  projectKinds?.has(
                    "MEETING_SOON",
                  )
                ? "team"
                : null;

          return {
            id: row.project.id,
            title: row.project.title,
            summary:
              row.project.summary,
            status:
              row.project.status,
            updatedAt:
              row.project.updatedAt,
            participation:
              row.isPrimaryMentor
                ? "Primary mentor"
                : "Mentor",
            attention:
              projectAlerts,
            href:
              "/mentor/projects/" +
              row.project.id +
              (directTab
                ? "?tab=" +
                  directTab
                : ""),
          };
        })}
        basePath="/mentor/projects"
        emptyTitle={
          query.search ||
          query.status ||
          query.attention
            ? "No mentoring Projects match these filters"
            : "No mentoring Projects"
        }
        emptyDescription={
          query.search ||
          query.status ||
          query.attention
            ? "Clear or change the filters to see other assigned Projects."
            : "Projects appear here when a College Admin assigns your Mentor membership to the team."
        }
      />

      <ProjectParticipantPagination
        basePath="/mentor/projects"
        query={query}
        page={page}
        totalPages={totalPages}
        total={total}
      />

      <p className="m-0 text-xs leading-5 text-muted-foreground">
        Legacy also filters explicit Blocked workspaces. DB07 vNext does not yet persist the workspace blocker field, so that filter remains a tracked parity blocker instead of being simulated from unrelated states.
      </p>
    </div>
  );
}
