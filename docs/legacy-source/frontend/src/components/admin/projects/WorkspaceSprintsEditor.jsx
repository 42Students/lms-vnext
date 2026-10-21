import { Alert, Button, Card, Form, Typography } from "antd";
import RepeatingItemEditor, { validateRepeatingItems } from "@/components/admin/projects/RepeatingItemEditor";
import { sprintRowMeta } from "@/components/admin/projects/workspaceRowMeta";

const { Text } = Typography;

const countState = (rows, expected) =>
  (Array.isArray(rows) ? rows : []).filter(
    (row) => String(row?.sprintState || "PLANNED").toUpperCase() === expected
  ).length;

export default function WorkspaceSprintsEditor({
  form,
  workspace,
  sprints,
  fields,
  releaseOptions,
  releasesLoading,
  releasesError,
  onRetryReleases,
  onFinish,
  submitting,
}) {
  const rows = Array.isArray(sprints) ? sprints : [];
  const metrics = [
    { label: "Total sprints", value: rows.length },
    { label: "Active", value: countState(rows, "ACTIVE") },
    { label: "Completed", value: countState(rows, "COMPLETED") },
    { label: "Releases available", value: releaseOptions.length },
  ];

  return (
    <Card title="Sprint plan" className="admin-form-card project-workspace-sprints__editor">
      <div className="project-workspace-sprints__intro">
        <div>
          <div className="project-workspace-sprints__eyebrow">Delivery cadence</div>
          <div className="project-workspace-sprints__headline">Plan work in clear, release-bound increments</div>
        </div>
        <Text type="secondary">
          Keep sprint goals outcome-focused and attach every sprint to the release it contributes to.
          The row summaries let you scan dates and task completion without expanding everything.
        </Text>
      </div>

      <div className="project-workspace-sprints__metrics" aria-label="Sprint plan summary">
        {metrics.map((metric) => (
          <div className="project-workspace-sprints__metric" key={metric.label}>
            <Text type="secondary">{metric.label}</Text>
            <div>{metric.value}</div>
          </div>
        ))}
      </div>

      {releasesLoading ? (
        <Alert
          type="info"
          showIcon
          className="project-workspace-sprints__notice"
          message="Loading project releases…"
          description="Release choices will appear as soon as the project release list is available."
        />
      ) : releasesError ? (
        <Alert
          type="error"
          showIcon
          className="project-workspace-sprints__notice"
          message="Project releases could not be loaded"
          description={releasesError}
          action={<Button size="small" onClick={onRetryReleases}>Retry</Button>}
        />
      ) : releaseOptions.length === 0 ? (
        <Alert
          type="warning"
          showIcon
          className="project-workspace-sprints__notice"
          message="No releases on this project yet"
          description="A sprint must belong to a release. Create or seed a project release before adding a new sprint."
        />
      ) : null}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="sprints"
          label="Sprints"
          rules={[{ validator: validateRepeatingItems(fields) }]}
        >
          <RepeatingItemEditor
            fields={fields}
            dynamicOptions={{ releaseKey: releaseOptions }}
            titleOf={(row, index) => row?.title || `Sprint ${index + 1}`}
            metaOf={sprintRowMeta(workspace)}
            addLabel="Add sprint"
            emptyText="No sprints yet. Add the first sprint when a release is ready."
          />
        </Form.Item>
        <div className="admin-form-actions">
          <Button type="primary" htmlType="submit" loading={submitting}>
            Save sprint plan
          </Button>
          <Text type="secondary">Only this workspace’s sprint plan is updated.</Text>
        </div>
      </Form>
    </Card>
  );
}
