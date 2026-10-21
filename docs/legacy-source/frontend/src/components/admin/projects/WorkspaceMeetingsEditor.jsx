import { Button, Card, Form, Typography } from "antd";
import RepeatingItemEditor, { validateRepeatingItems } from "@/components/admin/projects/RepeatingItemEditor";

const { Text } = Typography;

const withFriendlyDateTimeFields = (fields) =>
  fields.map((field) => {
    if (field.name === "meetingDate") return { ...field, type: "date", placeholder: "Select meeting date" };
    if (field.name === "startTime" || field.name === "endTime") {
      return { ...field, type: "time", placeholder: field.name === "startTime" ? "Start time" : "End time" };
    }
    return field;
  });

export default function WorkspaceMeetingsEditor({
  form,
  fields,
  sprintOptions,
  taskOptions,
  onFinish,
  submitting,
}) {
  const meetings = Form.useWatch("meetingsList", form);
  const rows = Array.isArray(meetings) ? meetings : [];
  const editorFields = withFriendlyDateTimeFields(fields);
  const completed = rows.filter((row) => String(row?.meetingStatus || "").toUpperCase() === "COMPLETED").length;
  const scheduled = rows.filter((row) =>
    ["SCHEDULED", "RESCHEDULED", "REQUESTED"].includes(String(row?.meetingStatus || "").toUpperCase())
  ).length;
  const linked = rows.filter((row) => row?.linkedSprintKey || row?.linkedTaskKey).length;

  const metrics = [
    { label: "Meetings", value: rows.length },
    { label: "Upcoming / requested", value: scheduled },
    { label: "Completed", value: completed },
    { label: "Linked to work", value: linked },
  ];

  return (
    <Card title="Meeting plan" className="admin-form-card project-workspace-meetings__editor">
      <div className="project-workspace-meetings__intro">
        <div>
          <div className="project-workspace-meetings__eyebrow">Team cadence</div>
          <div className="project-workspace-meetings__headline">Keep project conversations attached to the work they move forward</div>
        </div>
        <Text type="secondary">
          Use the date and time controls for scheduling, and link meetings to a sprint or task when the
          conversation is about specific delivery work.
        </Text>
      </div>

      <div className="project-workspace-meetings__metrics" aria-label="Meeting plan summary">
        {metrics.map((metric) => (
          <div className="project-workspace-meetings__metric" key={metric.label}>
            <Text type="secondary">{metric.label}</Text>
            <div>{metric.value}</div>
          </div>
        ))}
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="meetingsList"
          label="Meetings"
          rules={[{ validator: validateRepeatingItems(editorFields) }]}
        >
          <RepeatingItemEditor
            fields={editorFields}
            titleOf={(row, index) => row?.title || `Meeting ${index + 1}`}
            addLabel="Add meeting"
            emptyText="No meetings yet. Add one when the team needs a planned touchpoint."
            dynamicOptions={{ linkedSprintKey: sprintOptions, linkedTaskKey: taskOptions }}
          />
        </Form.Item>
        <div className="admin-form-actions">
          <Button type="primary" htmlType="submit" loading={submitting}>
            Save meeting plan
          </Button>
          <Text type="secondary">Calendar sync and follow-up state remain system-managed.</Text>
        </div>
      </Form>
    </Card>
  );
}
