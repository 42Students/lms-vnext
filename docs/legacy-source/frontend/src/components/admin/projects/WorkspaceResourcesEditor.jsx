import { Button, Card, Form, Typography } from "antd";
import RepeatingItemEditor, { validateRepeatingItems } from "@/components/admin/projects/RepeatingItemEditor";

const { Text } = Typography;

export default function WorkspaceResourcesEditor({ form, fields, onFinish, submitting }) {
  const resources = Form.useWatch("resources", form);
  const rows = Array.isArray(resources) ? resources : [];
  const links = rows.filter((row) => String(row?.type || "").toUpperCase() === "LINK").length;
  const files = rows.length - links;
  const withAccessNotes = rows.filter((row) => String(row?.accessNotes || "").trim()).length;

  const metrics = [
    { label: "Resources", value: rows.length },
    { label: "Links", value: links },
    { label: "Files & media", value: files },
    { label: "With access notes", value: withAccessNotes },
  ];

  return (
    <Card title="Resource library" className="admin-form-card project-workspace-resources__editor">
      <div className="project-workspace-resources__intro">
        <div>
          <div className="project-workspace-resources__eyebrow">Project references</div>
          <div className="project-workspace-resources__headline">Keep everything the team needs in one curated place</div>
        </div>
        <Text type="secondary">
          Add only useful project references, label them clearly, and include access notes when a link or file
          needs a college account, permission request, or other prerequisite.
        </Text>
      </div>

      <div className="project-workspace-resources__metrics" aria-label="Resource library summary">
        {metrics.map((metric) => (
          <div className="project-workspace-resources__metric" key={metric.label}>
            <Text type="secondary">{metric.label}</Text>
            <div>{metric.value}</div>
          </div>
        ))}
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="resources"
          label="Resources"
          rules={[{ validator: validateRepeatingItems(fields) }]}
        >
          <RepeatingItemEditor
            fields={fields}
            titleOf={(row, index) => row?.title || `Resource ${index + 1}`}
            addLabel="Add resource"
            emptyText="No resources yet. Add only the references the team will actually use."
          />
        </Form.Item>
        <div className="admin-form-actions">
          <Button type="primary" htmlType="submit" loading={submitting}>
            Save resource library
          </Button>
          <Text type="secondary">Resources are shared with the workspace team.</Text>
        </div>
      </Form>
    </Card>
  );
}
