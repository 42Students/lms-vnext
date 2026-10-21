import { Alert, Card, Progress, Tag, Typography } from "antd";
import { LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { formatTimestamp, projectProgress, textOrDash } from "@/components/admin/projects/adminProjectUtils";

const { Text } = Typography;

const overrideTag = (readiness) => {
  if (!readiness?.overrideActive) return null;
  return readiness.overrideValue ? (
    <Tag icon={<UnlockOutlined />} color="green">Force unlocked</Tag>
  ) : (
    <Tag icon={<LockOutlined />} color="volcano">Force blocked</Tag>
  );
};

export default function WorkspaceReadinessOverview({ workspace, readiness, submissionCoverage }) {
  if (!readiness) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Readiness snapshot is unavailable"
        description="The workspace loaded, but its readiness calculation was not included. Retry before making a submission-readiness decision."
      />
    );
  }

  const ready = Boolean(readiness.readyForSubmission);
  const progress = projectProgress(workspace);
  const metrics = [
    { label: "Tasks complete", value: `${readiness.completedTasks ?? 0} / ${readiness.totalTasks ?? 0}` },
    { label: "Sprints complete", value: `${readiness.completedSprints ?? 0} / ${readiness.totalSprints ?? 0}` },
    {
      label: "Proof coverage",
      value: submissionCoverage.completed > 0
        ? `${submissionCoverage.withSubmission} / ${submissionCoverage.completed} completed tasks`
        : "No completed tasks yet",
    },
    {
      label: "Submission",
      value: readiness.submissionExists ? textOrDash(readiness.submissionStatus) : "Not submitted",
    },
  ];

  return (
    <>
      <Card className="project-workspace-readiness__hero admin-list-page__card-gap">
        <div className="project-workspace-readiness__topline">
          <div>
            <div className="project-workspace-readiness__eyebrow">Submission readiness</div>
            <div className="project-workspace-readiness__headline">
              {ready ? "This workspace is ready to submit" : "This workspace still has readiness gaps"}
            </div>
          </div>
          <Tag color={ready ? "green" : "red"}>{ready ? "Ready" : "Not ready"}</Tag>
        </div>

        <div className="project-workspace-readiness__progress">
          <div className="project-workspace-readiness__progress-label">
            <Text strong>Overall project progress</Text>
            <Text strong>{progress}%</Text>
          </div>
          <Progress percent={progress} status={ready ? "success" : "active"} showInfo={false} />
        </div>

        <div className="project-workspace-readiness__metrics">
          {metrics.map((metric) => (
            <div className="project-workspace-readiness__metric" key={metric.label}>
              <Text type="secondary">{metric.label}</Text>
              <div>{metric.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {readiness.overrideActive ? (
        <Alert
          className="admin-list-page__card-gap project-workspace-readiness__override"
          type={readiness.overrideValue ? "success" : "warning"}
          showIcon
          message={<span>Readiness override active · {overrideTag(readiness)}</span>}
          description={
            <div className="project-workspace-readiness__override-grid">
              <div>
                <Text type="secondary">Reason</Text>
                <div>{textOrDash(readiness.overrideNote)}</div>
              </div>
              <div>
                <Text type="secondary">Set by</Text>
                <div>{textOrDash(readiness.overrideByName)}</div>
              </div>
              <div>
                <Text type="secondary">Set at</Text>
                <div>{formatTimestamp(readiness.overrideAt)}</div>
              </div>
            </div>
          }
        />
      ) : (
        <Card size="small" className="project-workspace-readiness__override-empty">
          <Text type="secondary">
            No manual readiness override is active. The status above is based on workspace progress and submission rules.
          </Text>
        </Card>
      )}
    </>
  );
}
