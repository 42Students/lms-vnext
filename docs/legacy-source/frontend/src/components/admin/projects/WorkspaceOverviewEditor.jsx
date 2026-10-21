import { Button, Card, Col, Form, Input, Row, Typography } from "antd";

const { TextArea } = Input;
const { Paragraph, Text, Title } = Typography;

const hasLines = (value) =>
  String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length > 0;

/**
 * Shared project-brief editor for College Admin and Super Admin.
 * The owning page keeps data loading/saving; this component keeps the information hierarchy and
 * validation presentation identical across both roles.
 */
export default function WorkspaceOverviewEditor({ form, onFinish, submitting }) {
  return (
    <Card title="Project brief" className="admin-form-card project-workspace-overview__editor">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="project-workspace-overview__lede">
          <div>
            <Text className="project-workspace-overview__eyebrow">Learner & mentor view</Text>
            <Title level={4}>Make the project understandable before anyone opens the board.</Title>
          </div>
          <Paragraph type="secondary">
            This content becomes the shared “About this project” reference for the team. Keep it outcome-focused,
            concrete and easy to scan.
          </Paragraph>
        </div>

        <section className="project-workspace-overview__section" aria-labelledby="project-overview-goal">
          <div className="project-workspace-overview__section-heading">
            <Title level={5} id="project-overview-goal">Goal</Title>
            <Text type="secondary">Why the project exists, who it serves and what success should look like.</Text>
          </div>
          <Form.Item
            name="overviewGoal"
            label="Project goal / description"
            extra="Shown as “About this project” on the learner and mentor Overview tab."
          >
            <TextArea
              autoSize={{ minRows: 4, maxRows: 9 }}
              placeholder="Describe the problem, expected outcome and what a successful project should achieve."
            />
          </Form.Item>
        </section>

        <Row gutter={[20, 20]} className="project-workspace-overview__split">
          <Col xs={24} lg={12}>
            <section className="project-workspace-overview__section project-workspace-overview__section--boxed" aria-labelledby="project-overview-deliverables">
              <div className="project-workspace-overview__section-heading">
                <Title level={5} id="project-overview-deliverables">Deliverables</Title>
                <Text type="secondary">The concrete outputs the team is expected to produce.</Text>
              </div>
              <Form.Item
                name="overviewDeliverablesText"
                label="Deliverables"
                extra="One per line. These appear as a checklist for mentors and students."
                rules={[
                  {
                    validator: (_, value) =>
                      hasLines(value) ? Promise.resolve() : Promise.reject(new Error("Add at least one deliverable.")),
                  },
                ]}
              >
                <TextArea
                  autoSize={{ minRows: 7, maxRows: 12 }}
                  placeholder={"Wireframes for all core screens\nWorking prototype\nFinal presentation deck"}
                />
              </Form.Item>
            </section>
          </Col>

          <Col xs={24} lg={12}>
            <section className="project-workspace-overview__section project-workspace-overview__section--boxed" aria-labelledby="project-overview-dod">
              <div className="project-workspace-overview__section-heading">
                <Title level={5} id="project-overview-dod">Definition of done</Title>
                <Text type="secondary">The project-level conditions that mean the work is genuinely complete.</Text>
              </div>
              <Form.Item
                name="overviewDoDText"
                label="Completion conditions"
                extra="One condition per line. Keep these verifiable rather than aspirational."
              >
                <TextArea
                  autoSize={{ minRows: 7, maxRows: 12 }}
                  placeholder={"All acceptance criteria pass\nDeployed to a public URL\nMentor sign-off recorded"}
                />
              </Form.Item>
            </section>
          </Col>
        </Row>

        <section className="project-workspace-overview__section" aria-labelledby="project-overview-personas">
          <div className="project-workspace-overview__section-heading">
            <Title level={5} id="project-overview-personas">Personas & ownership</Title>
            <Text type="secondary">Explain the working roles students can take and what each one owns.</Text>
          </div>
          <Form.Item
            name="overviewPersonasText"
            label="Personas"
            extra="One per line. Use a short role name followed by the ownership boundary."
          >
            <TextArea
              autoSize={{ minRows: 4, maxRows: 10 }}
              placeholder={"Frontend lead — owns the board UI and component structure\nBackend lead — owns the API and data model"}
            />
          </Form.Item>
        </section>

        <div className="admin-form-actions">
          <Button type="primary" htmlType="submit" loading={submitting}>
            Save project brief
          </Button>
          <Text type="secondary">Changes update the Overview seen by mentors and students.</Text>
        </div>
      </Form>
    </Card>
  );
}
