import { Alert, Card, Typography } from "antd";
import { asArray, textOrDash } from "@/components/admin/projects/adminProjectUtils";
import { TeamGroupNotice, TeamMembersTable } from "@/components/admin/projects/workspaceRowMeta";

const { Text } = Typography;

/** Shared read-first Team surface for College Admin and Super Admin. */
export default function WorkspaceTeamOverview({
  workspace,
  workspaceId,
  collegeId,
  members,
  primaryMentor,
  roleOf,
  onRepaired,
}) {
  const learnerMembers = asArray(members).filter(
    (member) => String(member?.userType || "").toUpperCase() === "LEARNER"
  );
  const facultyMembers = asArray(members).filter(
    (member) => String(member?.userType || "").toUpperCase() === "FACULTY"
  );
  const tasks = asArray(workspace?.resolvedTasks || workspace?.tasks);
  const assignedLearnerIds = new Set(
    tasks
      .map((task) => task?.assigneeId)
      .filter((id) => id !== undefined && id !== null)
      .map(String)
  );
  const learnersWithWork = learnerMembers.filter((member) =>
    assignedLearnerIds.has(String(member?.userId ?? member?.id))
  ).length;
  const supportingFaculty = Math.max(0, facultyMembers.length - (primaryMentor ? 1 : 0));

  const metrics = [
    {
      label: "Primary mentor",
      value: textOrDash(primaryMentor?.name || workspace?.mentor),
      tone: primaryMentor || workspace?.mentor ? "default" : "warning",
    },
    { label: "Students", value: String(learnerMembers.length) },
    { label: "Supporting faculty", value: String(supportingFaculty) },
    {
      label: "Task coverage",
      value: learnerMembers.length
        ? `${learnersWithWork} / ${learnerMembers.length} students assigned work`
        : "No students yet",
    },
  ];

  return (
    <>
      <Card className="project-workspace-team__snapshot admin-list-page__card-gap">
        <div className="project-workspace-team__intro">
          <div>
            <div className="project-workspace-team__eyebrow">Team at a glance</div>
            <div className="project-workspace-team__headline">Ownership and workload in one view</div>
          </div>
          <Text type="secondary">
            Use the roster below to spot students without assigned work, confirm mentor ownership,
            and understand who is actively carrying the project.
          </Text>
        </div>

        <div className="project-workspace-team__metrics">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={`project-workspace-team__metric${metric.tone === "warning" ? " project-workspace-team__metric--warning" : ""}`}
            >
              <Text type="secondary" className="project-workspace-team__metric-label">{metric.label}</Text>
              <div className="project-workspace-team__metric-value">{metric.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {!primaryMentor && !workspace?.mentor ? (
        <Alert
          type="warning"
          showIcon
          className="admin-list-page__card-gap"
          message="No primary mentor assigned"
          description="Assign a mentor before moving this workspace into an active operating state."
        />
      ) : null}

      <TeamGroupNotice
        workspace={workspace}
        workspaceId={workspaceId}
        collegeId={collegeId}
        onRepaired={onRepaired}
      />

      <Card
        title={`Team roster (${asArray(members).length})`}
        className="admin-list-page__card-gap project-workspace-team__roster"
        extra={<Text type="secondary">Search, filter and compare task activity</Text>}
      >
        <TeamMembersTable workspace={workspace} members={members} roleOf={roleOf} />
      </Card>
    </>
  );
}
