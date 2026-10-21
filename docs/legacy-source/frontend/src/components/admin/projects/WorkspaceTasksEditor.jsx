import Link from "next/link";
import { Alert, Button, Card, Empty, Form, Table, Typography } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import {
  asArray,
  formatTimestamp,
  resolveProjectMemberName,
} from "@/components/admin/projects/adminProjectUtils";
import RepeatingItemEditor, { validateRepeatingItems } from "@/components/admin/projects/RepeatingItemEditor";
import { taskRowMeta } from "@/components/admin/projects/workspaceRowMeta";

const { Text } = Typography;

const safeHttpUrl = (value) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
};

const countStatus = (tasks, states) =>
  tasks.filter((task) => states.includes(String(task?.status || "").toUpperCase())).length;

export default function WorkspaceTasksEditor({
  form,
  workspace,
  workspaceId,
  basePath,
  sprintRows,
  sprintOptions,
  fields,
  onFinish,
  submitting,
}) {
  const authoredTasks = Form.useWatch("tasks", form);
  const liveTasks = asArray(workspace?.resolvedTasks);
  const submittedTasks = liveTasks.filter((task) => task?.submissionUrl);
  const currentRows = Array.isArray(authoredTasks) ? authoredTasks : [];

  const metrics = [
    { label: "Tasks", value: currentRows.length },
    { label: "In progress", value: countStatus(liveTasks, ["IN_PROGRESS", "IN_REVIEW"]) },
    { label: "Done", value: countStatus(liveTasks, ["DONE", "COMPLETED"]) },
    { label: "Submissions", value: submittedTasks.length },
  ];

  return (
    <>
      <Card title="Task plan" className="admin-form-card project-workspace-tasks__editor">
        <div className="project-workspace-tasks__intro">
          <div>
            <div className="project-workspace-tasks__eyebrow">Work breakdown</div>
            <div className="project-workspace-tasks__headline">Turn sprint goals into clear, reviewable work</div>
          </div>
          <Text type="secondary">
            Keep each task small enough to own, link it to the right sprint, and make “done” explicit.
            Workflow state and learner submissions stay read-only here.
          </Text>
        </div>

        <div className="project-workspace-tasks__metrics" aria-label="Task plan summary">
          {metrics.map((metric) => (
            <div className="project-workspace-tasks__metric" key={metric.label}>
              <Text type="secondary">{metric.label}</Text>
              <div>{metric.value}</div>
            </div>
          ))}
        </div>

        {!sprintRows.length ? (
          <Alert
            type="info"
            showIcon
            className="project-workspace-tasks__notice"
            message="No sprints are available yet"
            description={
              <span>
                You can still draft tasks, but add sprints on the{" "}
                <Link href={`${basePath}/projects/workspaces/${workspaceId}/sprints`}>Sprints</Link>{" "}
                tab before assigning tasks to a delivery cycle.
              </span>
            }
          />
        ) : null}

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="tasks"
            label="Tasks"
            rules={[{ validator: validateRepeatingItems(fields) }]}
          >
            <RepeatingItemEditor
              fields={fields}
              titleOf={(row, index) => row?.title || `Task ${index + 1}`}
              metaOf={taskRowMeta}
              addLabel="Add task"
              emptyText="No tasks yet. Add the first task when the work breakdown is ready."
              dynamicOptions={{ sprintKey: sprintOptions }}
            />
          </Form.Item>
          <div className="admin-form-actions">
            <Button type="primary" htmlType="submit" loading={submitting}>
              Save task plan
            </Button>
            <Text type="secondary">Assignee, status and submission state are not changed here.</Text>
          </div>
        </Form>
      </Card>

      <Card
        title="Task submissions"
        className="admin-form-card project-workspace-tasks__submissions"
        extra={<Text type="secondary">{submittedTasks.length} with submission links</Text>}
      >
        {submittedTasks.length === 0 ? (
          <Empty
            description="No tasks have a submission link yet."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            size="small"
            rowKey={(task) => task.taskId || task.id || task.key || task.title}
            dataSource={submittedTasks}
            scroll={{ x: "max-content" }}
            pagination={
              submittedTasks.length > 10
                ? {
                    pageSize: 10,
                    showSizeChanger: false,
                    showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} submissions`,
                  }
                : false
            }
            columns={[
              { title: "Task", dataIndex: "title", key: "title" },
              {
                title: "Submission",
                key: "submissionUrl",
                render: (_, task) => {
                  const url = safeHttpUrl(task.submissionUrl);
                  return url ? (
                    <a href={url} target="_blank" rel="noreferrer noopener">
                      Open submission <LinkOutlined />
                    </a>
                  ) : (
                    <Text type="secondary">Unavailable link</Text>
                  );
                },
              },
              {
                title: "Submitted by",
                key: "submittedBy",
                render: (_, task) =>
                  resolveProjectMemberName(workspace, task.submittedBy) || <Text type="secondary">—</Text>,
              },
              {
                title: "Submitted at",
                key: "submittedAt",
                render: (_, task) => formatTimestamp(task.submittedAt),
              },
            ]}
          />
        )}
      </Card>
    </>
  );
}
