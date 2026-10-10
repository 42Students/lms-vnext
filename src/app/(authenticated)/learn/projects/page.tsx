import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ProjectParticipantListControls,
  ProjectParticipantPagination,
  type ProjectParticipantListQuery,
} from "@/components/projects/project-participant-list-controls";
import { ProjectList } from "@/components/projects/project-list";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { listMyLearnerProjectAttention } from "@/modules/projects/learner-attention-service";
import { listMyProjectInstances } from "@/modules/projects/member-service";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePageSize(value: string | undefined) {
  const parsed = Number(value);
  return parsed === 50 || parsed === 100 ? parsed : 25;
}

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default async function LearnerProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context, "LEARNER")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const status = one(params.status);
  const attention = one(params.attention);
  const query: ProjectParticipantListQuery = {
    search: one(params.search)?.trim() || undefined,
    status:
      status === "CURRENT" ||
      status === "PLANNED" ||
      status === "ACTIVE" ||
      status === "COMPLETED" ||
      status === "ARCHIVED"
        ? status
        : undefined,
    attention: attention === "LEARNER_ACTION" ? attention : undefined,
    page: parsePage(one(params.page)),
    pageSize: parsePageSize(one(params.pageSize)),
  };

  const [allRows, attentionRows] = await Promise.all([
    listMyProjectInstances(context),
    listMyLearnerProjectAttention(context),
  ]);

  const attentionByProject = new Map<
    string,
    "CHANGES_REQUESTED" | "DRAFT"
  >(attentionRows.map((item) => [item.projectId, item.kind]));

  const normalizedSearch = query.search?.toLowerCase();
  const filtered = allRows
    .filter((row) => row.memberRole === "LEARNER")
    .filter((row) => {
      if (!normalizedSearch) return true;
      return [
        row.project.title,
        row.project.slug,
        row.project.summary ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    })
    .filter((row) => {
      if (!query.status) return true;
      if (query.status === "CURRENT") {
        return row.project.status !== "ARCHIVED" &&
          row.project.status !== "COMPLETED";
      }
      return row.project.status === query.status;
    })
    .filter((row) =>
      query.attention !== "LEARNER_ACTION" ||
      attentionByProject.has(row.project.id),
    )
    .sort((a, b) => {
      const archivedOrder =
        Number(a.project.status === "ARCHIVED") -
        Number(b.project.status === "ARCHIVED");
      if (archivedOrder) return archivedOrder;
      return (
        b.project.updatedAt.getTime() - a.project.updatedAt.getTime() ||
        a.project.title.localeCompare(b.project.title)
      );
    });

  const total = filtered.length;
  const size = query.pageSize ?? 25;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(query.page ?? 1, totalPages);
  const rows = filtered.slice((page - 1) * size, page * size);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner"
        title="Projects"
        description="Your active Project workspaces, team responsibilities and final delivery progress."
      />

      <ProjectParticipantListControls
        basePath="/learn/projects"
        query={{ ...query, page }}
        learner
      />

      <ProjectList
        items={rows.map((row) => {
          const projectAttention = attentionByProject.get(row.project.id);
          return {
            id: row.project.id,
            title: row.project.title,
            summary: row.project.summary,
            status: row.project.status,
            updatedAt: row.project.updatedAt,
            participation: "Learner",
            attention:
              projectAttention === "CHANGES_REQUESTED"
                ? ["Changes requested"]
                : projectAttention === "DRAFT"
                  ? ["Draft submission"]
                  : [],
            href:
              "/learn/projects/" +
              row.project.id +
              (projectAttention ? "?tab=delivery" : ""),
          };
        })}
        basePath="/learn/projects"
        emptyTitle={
          query.search || query.status || query.attention
            ? "No Projects match these filters"
            : "No Projects yet"
        }
        emptyDescription={
          query.search || query.status || query.attention
            ? "Clear or change the filters to see other assigned Projects."
            : "Projects will appear here after your college assigns you to a Project team."
        }
      />

      <ProjectParticipantPagination
        basePath="/learn/projects"
        query={query}
        page={page}
        totalPages={totalPages}
        total={total}
      />

      <p className="m-0 text-xs leading-5 text-muted-foreground">
        Legacy also exposes explicit workspace blocker attention. DB07 vNext does not yet persist that blocker field, so this page does not infer a false Blocked signal from unrelated task states.
      </p>
    </div>
  );
}
