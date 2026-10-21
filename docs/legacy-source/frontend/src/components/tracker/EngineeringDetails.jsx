import { useEffect, useState } from "react";
import { Button, Checkbox, Col, Form, Input, Row, Select, message } from "antd";
import { updateBugWorkflow } from "@/api/Services/BugTrackerService";
import {
  AFFECTED_LAYER_OPTIONS,
  REGRESSION_TEST_OPTIONS,
  RESOLUTION_OPTIONS,
} from "@/data/bugTrackerData";

const { TextArea } = Input;

const FRONTEND_REPO = "https://github.com/42Students/lms2-fe";
const BACKEND_REPO = "https://github.com/42Students/lms";
// A commit SHA is only useful to link once it's long enough to be unambiguous on GitHub
// (GitHub itself accepts a 7-char abbreviation); anything shorter is still being typed.
const MIN_LINKABLE_SHA_LENGTH = 7;

function CommitLink({ repoUrl, sha }) {
  const trimmed = (sha || "").trim();
  if (trimmed.length < MIN_LINKABLE_SHA_LENGTH) return null;
  return (
    <a
      href={`${repoUrl}/commit/${encodeURIComponent(trimmed)}`}
      target="_blank"
      rel="noreferrer"
      className="tracker-commit-link"
    >
      View on GitHub ↗
    </a>
  );
}

export default function EngineeringDetails({ issue, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const frontendCommitSha = Form.useWatch("frontendCommitSha", form);
  const backendCommitSha = Form.useWatch("backendCommitSha", form);

  useEffect(() => {
    if (!issue) return;
    form.setFieldsValue({
      affectedLayer: issue.affectedLayer || undefined,
      rootCause: issue.rootCause || "",
      fixNotes: issue.fixNotes || "",
      frontendCommitSha: issue.frontendCommitSha || "",
      backendCommitSha: issue.backendCommitSha || "",
      regressionTestStatus: issue.regressionTestStatus || "NOT_REVIEWED",
      productionVerified: Boolean(issue.productionVerified),
      resolution: issue.resolution || undefined,
    });
  }, [issue, form]);

  const save = async (values) => {
    if (!issue || saving) return;
    setSaving(true);
    try {
      const updated = await updateBugWorkflow(issue.publicId, {
        affectedLayer: values.affectedLayer || "",
        rootCause: values.rootCause || "",
        fixNotes: values.fixNotes || "",
        frontendCommitSha: values.frontendCommitSha || "",
        backendCommitSha: values.backendCommitSha || "",
        regressionTestStatus: values.regressionTestStatus || "NOT_REVIEWED",
        productionVerified: Boolean(values.productionVerified),
        resolution: values.resolution || "",
      });
      onSaved?.(updated);
      message.success("Engineering details saved");
    } catch (error) {
      message.error(error?.message || "Engineering details could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <details className="tracker-engineering">
      <summary>
        <span>
          <strong>Engineering details</strong>
          <small>Root cause, fix commits, regression coverage and production verification</small>
        </span>
        <span className="tracker-engineering__chevron">⌄</span>
      </summary>

      <div className="tracker-engineering__body">
        {(issue.sourceUrl || issue.sourcePath || issue.browser || issue.viewport) && (
          <div className="tracker-source-context">
            <div>
              <span>Source page</span>
              {issue.sourceUrl ? (
                <a href={issue.sourceUrl} target="_blank" rel="noreferrer">{issue.sourceUrl}</a>
              ) : (
                <strong>{issue.sourcePath || "—"}</strong>
              )}
            </div>
            {issue.sourcePath && (
              <div><span>Route</span><strong>{issue.sourcePath}</strong></div>
            )}
            {issue.viewport && (
              <div><span>Viewport</span><strong>{issue.viewport}</strong></div>
            )}
            {issue.browser && (
              <div className="tracker-source-context__wide"><span>Browser</span><strong>{issue.browser}</strong></div>
            )}
          </div>
        )}

        <Form form={form} layout="vertical" requiredMark={false} onFinish={save}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="affectedLayer" label="Affected layer">
                <Select allowClear placeholder="Frontend, backend, or both" options={AFFECTED_LAYER_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="regressionTestStatus" label="Regression coverage">
                <Select options={REGRESSION_TEST_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="rootCause" label="Root cause">
            <TextArea autoSize={{ minRows: 2, maxRows: 5 }} maxLength={4000} placeholder="What actually caused the issue?" />
          </Form.Item>

          <Form.Item name="fixNotes" label="Fix notes">
            <TextArea autoSize={{ minRows: 2, maxRows: 5 }} maxLength={4000} placeholder="What changed, and anything important for retest?" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="frontendCommitSha" label="Frontend commit">
                <Input maxLength={64} placeholder="Commit SHA" />
              </Form.Item>
              <CommitLink repoUrl={FRONTEND_REPO} sha={frontendCommitSha} />
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="backendCommitSha" label="Backend commit">
                <Input maxLength={64} placeholder="Commit SHA" />
              </Form.Item>
              <CommitLink repoUrl={BACKEND_REPO} sha={backendCommitSha} />
            </Col>
          </Row>

          <Row gutter={16} align="middle">
            <Col xs={24} md={12}>
              <Form.Item name="resolution" label="Resolution">
                <Select allowClear placeholder="Leave open unless terminal" options={RESOLUTION_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="productionVerified" valuePropName="checked" className="tracker-engineering__checkbox">
                <Checkbox>Verified in production</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <div className="tracker-engineering__actions">
            <Button type="primary" htmlType="submit" loading={saving}>Save details</Button>
          </div>
        </Form>
      </div>
    </details>
  );
}
