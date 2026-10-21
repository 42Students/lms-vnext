import Link from "next/link";
import { Card, Progress, Space, Tag, Typography } from "antd";
import {
  asArray,
  derivedProjectProgress,
  projectStatus,
  statusColor,
  statusLabel,
} from "@/components/admin/projects/adminProjectUtils";

const { Paragraph, Text } = Typography;

const completedCount = (items) =>
  asArray(items).filter((item) => {
    const state = String(item?.status ?? item?.state ?? "").toUpperCase();
    return state === "DONE" || state === "COMPLETED" || state === "COMPLETE";
  }).length;

const formatTargetDate = (value) => {
  if (!value) return "Not set";
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value;
    return new Date(year, (month || 1) - 1, day).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  const text = String(value);
  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00` : text;
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime())
    ? text
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

/**
 * Read-first workspace snapshot shared by College Admin and Super Admin.
 * It deliberately uses only fields already present on the workspace detail payload, so this
 * improves scanability without adding requests or changing project lifecycle behavior.
 */
export default function WorkspaceSummarySnapshot({ workspace, basePath }) {
  const readiness = workspace?.readiness || {};
  const members = asArray(workspace?.members || workspace?.resolvedMembers);
  const tasks = asArray(workspace?.resolvedTasks || workspace?.tasks);
  const sprints = asArray(workspace?.resolvedSprints || workspace?.sprints);

  const totalTasks = Number(readiness?.totalTasks ?? tasks.length) || 0;
  const doneTasks = Number(readiness?.completedTasks ?? completedCount(tasks)) || 0;
  const totalSprints = Number(readiness?.totalSprints ?? sprints.length) || 0;
  const doneSprints = Number(readiness?.completedSprints ?? completedCount(sprints)) || 0;
  const progress = derivedProjectProgress(workspace) ?? Math.max(0, Math.min(100, Number(workspace?.progress || 0)));

  const templateName = [workspace?.templateTitle, workspace?.templateSlug]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find(Boolean);
  const templateLabel = [templateName, workspace?.templateVersion ? `v${workspace.templateVersion}` : null]
    .filter(Boolean)
    .join(" ");
  const templateTag = (
    <Tag className="project-workspace-summary__template-tag">
      {templateLabel ? `Template · ${templateLabel}` : "No template attached"}
    </Tag>
  );

  const facts = [
    { label: "Team", value: `${members.length} member${members.length === 1 ? "" : "s"}` },
    { label: "Tasks", value: totalTasks ? `${doneTasks} / ${totalTasks} done` : "No tasks yet" },
    { label: "Sprints", value: totalSprints ? `${doneSprints} / ${totalSprints} done` : "No sprints yet" },
    { label: "Target", value: formatTargetDate(workspace?.endDate || workspace?.dueDate || workspace?.dueLabel) },
  ];

  return (
    <Card className="project-workspace-summary__snapshot">
      <div className="project-workspace-summary__snapshot-grid">
        <div className="project-workspace-summary__primary">
          <div className="project-workspace-summary__eyebrow">Workspace health</div>
          <Space wrap size={[8, 8]} className="project-workspace-summary__tags">
            <Tag color={statusColor(projectStatus(workspace))}>{statusLabel(projectStatus(workspace))}</Tag>
            {workspace?.templateId ? (
              <Link href={`${basePath}/projects/templates/${encodeURIComponent(workspace.templateId)}`}>
                {templateTag}
              </Link>
            ) : (
              templateTag
            )}
            {workspace?.phase ? <Tag>Phase: {statusLabel(workspace.phase, "")}</Tag> : null}
          </Space>

          <Paragraph className="project-workspace-summary__summary" type={workspace?.summary ? undefined : "secondary"}>
            {workspace?.summary || "No workspace summary has been added yet."}
          </Paragraph>

          <div className="project-workspace-summary__progress-head">
            <Text strong>Overall progress</Text>
            <Text strong>{progress}%</Text>
          </div>
          <Progress percent={progress} showInfo={false} />
        </div>

        <div className="project-workspace-summary__metrics" aria-label="Workspace quick facts">
          {facts.map((fact) => (
            <div className="project-workspace-summary__metric" key={fact.label}>
              <Text type="secondary" className="project-workspace-summary__metric-label">
                {fact.label}
              </Text>
              <div className="project-workspace-summary__metric-value">{fact.value}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
