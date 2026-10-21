import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Cascader, Col, Form, Input, Row, Select } from "antd";
import TrackerShell from "@/components/tracker/TrackerShell";
import ScreenshotPicker from "@/components/tracker/ScreenshotPicker";
import SimilarIssuesPanel from "@/components/tracker/SimilarIssuesPanel";
import { createBugReport } from "@/api/Services/BugTrackerService";
import { RECENT_TRACKER_CONTEXT_KEY, uploadTrackerAttachments } from "@/utils/bugTrackerAttachments";
import {
  REPORTER_OPTIONS, ACCOUNT_OPTIONS, ENVIRONMENT_OPTIONS, ISSUE_TYPE_OPTIONS,
  LOCATION_OPTIONS, SEVERITY_OPTIONS,
} from "@/data/bugTrackerData";
import { locationPathToFields } from "@/utils/bugTrackerUtils";

const { TextArea } = Input;
const DRAFT_KEY = "42tracker_report_draft_v1";

function hasIssueDraft(values = {}) {
  return Boolean(
    values.location?.length ||
    values.issueType ||
    values.description?.trim() ||
    values.evidenceLink?.trim() ||
    (values.severity && values.severity !== "NOT_SURE")
  );
}

export default function TrackerReportPage() {
  const [form] = Form.useForm();
  const draftTimerRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [created, setCreated] = useState(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [screenshots, setScreenshots] = useState([]);
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false);
  const [uploadedScreenshotCount, setUploadedScreenshotCount] = useState(0);
  const [failedScreenshots, setFailedScreenshots] = useState([]);
  const descriptionValue = Form.useWatch("description", form);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedContext = JSON.parse(localStorage.getItem(RECENT_TRACKER_CONTEXT_KEY) || "{}");
      const savedDraft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      const defaults = {
        reporterName: savedContext.reporterName || undefined,
        accountRole: savedContext.accountRole || undefined,
        environment: savedContext.environment || undefined,
        severity: "NOT_SURE",
      };

      if (savedDraft && typeof savedDraft === "object" && hasIssueDraft(savedDraft)) {
        form.setFieldsValue({ ...defaults, ...savedDraft });
        setDraftRestored(true);
      } else {
        form.setFieldsValue(defaults);
      }
    } catch (_) {
      localStorage.removeItem(DRAFT_KEY);
      form.setFieldValue("severity", "NOT_SURE");
    }
  }, [form]);

  useEffect(() => () => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
  }, []);

  const saveDraft = () => {
    if (typeof window === "undefined") return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    const values = form.getFieldsValue(true);
    draftTimerRef.current = window.setTimeout(() => {
      if (hasIssueDraft(values)) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    }, 250);
  };

  const clearDraftKeepingContext = () => {
    const keep = {
      reporterName: form.getFieldValue("reporterName"),
      accountRole: form.getFieldValue("accountRole"),
      environment: form.getFieldValue("environment"),
    };
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY);
    form.resetFields();
    form.setFieldsValue({ ...keep, severity: "NOT_SURE" });
    setDraftRestored(false);
    setSubmitError("");
  };

  const uploadEntries = async (publicId, entries) => {
    if (!entries.length) return [];
    setUploadingScreenshots(true);
    const results = await uploadTrackerAttachments(publicId, entries);
    setUploadingScreenshots(false);

    const succeeded = results.filter((result) => result.ok);
    const failed = results.filter((result) => !result.ok);
    if (succeeded.length) {
      setUploadedScreenshotCount((count) => count + succeeded.length);
    }
    setFailedScreenshots(failed);
    return results;
  };

  const handleSubmit = async (values) => {
    if (submitting) return;
    if (typeof window !== "undefined") {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
        draftTimerRef.current = null;
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const location = locationPathToFields(values.location);
      const payload = {
        reporterName: values.reporterName,
        accountRole: values.accountRole,
        environment: values.environment,
        ...location,
        issueType: values.issueType,
        description: values.description.trim(),
        severity: values.severity,
        evidenceLink: values.evidenceLink?.trim() || null,
      };

      // Persist the issue first. Screenshot failures must never lose the report.
      const issue = await createBugReport(payload);
      setCreated(issue);

      if (typeof window !== "undefined") {
        localStorage.setItem(RECENT_TRACKER_CONTEXT_KEY, JSON.stringify({
          reporterName: values.reporterName,
          accountRole: values.accountRole,
          environment: values.environment,
        }));
        localStorage.removeItem(DRAFT_KEY);
      }
      draftTimerRef.current = null;
      setDraftRestored(false);

      if (screenshots.length) {
        await uploadEntries(
          issue.publicId,
          screenshots.map((file) => ({ file, storageKey: null }))
        );
      }
    } catch (error) {
      setSubmitError(error?.message || "The issue could not be reported. Your text is still here — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const retryFailedScreenshots = async () => {
    if (!created || !failedScreenshots.length || uploadingScreenshots) return;
    const retrying = failedScreenshots.map((item) => ({
      file: item.file,
      storageKey: item.storageKey,
    }));
    setFailedScreenshots([]);
    await uploadEntries(created.publicId, retrying);
  };

  const reportAnother = () => {
    clearDraftKeepingContext();
    setCreated(null);
    setScreenshots([]);
    setFailedScreenshots([]);
    setUploadedScreenshotCount(0);
    setUploadingScreenshots(false);
  };

  const handleKeyboardSubmit = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (!submitting) form.submit();
    }
  };

  return (
    <>
      <Head><title>Report Issue · 42 Tracker</title></Head>
      <TrackerShell active="report">
        <div className="tracker-report-wrap">
          {created ? (
            <section className="tracker-success-card" aria-live="polite">
              <div className="tracker-success-mark">✓</div>
              <p className="tracker-eyebrow">Issue reported</p>
              <h1>{created.publicId}</h1>
              <p>The issue is saved. You can continue testing immediately.</p>

              {uploadingScreenshots && (
                <div className="tracker-attachment-result is-uploading">
                  Uploading screenshots…
                </div>
              )}
              {!uploadingScreenshots && uploadedScreenshotCount > 0 && (
                <div className="tracker-attachment-result is-success">
                  {uploadedScreenshotCount} {uploadedScreenshotCount === 1 ? "screenshot" : "screenshots"} attached.
                </div>
              )}
              {!uploadingScreenshots && failedScreenshots.length > 0 && (
                <div className="tracker-attachment-result is-error">
                  <span>
                    The issue is safe, but {failedScreenshots.length} {failedScreenshots.length === 1 ? "screenshot" : "screenshots"} could not be attached.
                  </span>
                  <Button size="small" onClick={retryFailedScreenshots}>Retry screenshots</Button>
                </div>
              )}

              <div className="tracker-success-actions">
                <Link
                  className={`tracker-button tracker-button--secondary${uploadingScreenshots ? " is-disabled" : ""}`}
                  aria-disabled={uploadingScreenshots}
                  onClick={(event) => {
                    if (uploadingScreenshots) event.preventDefault();
                  }}
                  href={`/tracker/issues/${created.publicId}`}
                >
                  View issue
                </Link>
                <Button type="primary" disabled={uploadingScreenshots} onClick={reportAnother}>
                  Report another
                </Button>
              </div>
            </section>
          ) : (
            <>
              <header className="tracker-page-heading">
                <p className="tracker-eyebrow">Report an LMS issue</p>
                <h1>What went wrong?</h1>
                <p>Pick the context, describe the problem, and submit. No login needed.</p>
              </header>

              <section className="tracker-form-card" onKeyDown={handleKeyboardSubmit}>
                {draftRestored && (
                  <div className="tracker-draft-note" role="status">
                    <span>Unsaved report restored.</span>
                    <button type="button" onClick={clearDraftKeepingContext}>Discard draft</button>
                  </div>
                )}
                {submitError && <Alert type="error" showIcon message={submitError} className="tracker-alert" />}
                <Form
                  form={form}
                  layout="vertical"
                  requiredMark={false}
                  onFinish={handleSubmit}
                  onValuesChange={saveDraft}
                >
                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item name="reporterName" label="Reporter" rules={[{ required: true, message: "Select your name." }]}>
                        <Select placeholder="Select reporter" options={REPORTER_OPTIONS} showSearch optionFilterProp="label" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="accountRole" label="Account used" rules={[{ required: true, message: "Select the account you were testing." }]}>
                        <Select placeholder="Select account" options={ACCOUNT_OPTIONS} showSearch optionFilterProp="label" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="environment" label="Environment" rules={[{ required: true, message: "Select where you saw the issue." }]}>
                        <Select placeholder="Select environment" options={ENVIRONMENT_OPTIONS} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="location" label="Where did this happen?" rules={[{ required: true, message: "Select the page and area." }]}>
                    <Cascader
                      options={LOCATION_OPTIONS}
                      placeholder="Search or select page → screen → section"
                      showSearch
                      maxTagCount="responsive"
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} md={16}>
                      <Form.Item name="issueType" label="What kind of issue?" rules={[{ required: true, message: "Select the closest issue type." }]}>
                        <Select placeholder="Search issue type" options={ISSUE_TYPE_OPTIONS} showSearch optionFilterProp="label" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="severity" label="Severity" initialValue="NOT_SURE" rules={[{ required: true }]}>
                        <Select options={SEVERITY_OPTIONS} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="description"
                    label="What went wrong?"
                    rules={[
                      { required: true, whitespace: true, message: "Describe what went wrong." },
                      { max: 4000, message: "Keep the description under 4000 characters." },
                    ]}
                  >
                    <TextArea
                      autoSize={{ minRows: 5, maxRows: 10 }}
                      maxLength={4000}
                      showCount
                      placeholder="Example: I opened Lesson 3 and the lesson content kept loading without showing anything."
                    />
                  </Form.Item>

                  <SimilarIssuesPanel description={descriptionValue} />

                  <ScreenshotPicker files={screenshots} onChange={setScreenshots} disabled={submitting} />

                  <Form.Item
                    name="evidenceLink"
                    label="Evidence link"
                    extra="Optional — use this for a screen recording, Drive file, or other useful http/https link."
                    rules={[{ max: 1000, message: "Evidence link is too long." }]}
                  >
                    <Input type="url" placeholder="https://…" />
                  </Form.Item>

                  <div className="tracker-form-footer">
                    <span>Draft saves automatically · Paste screenshots anywhere · Ctrl/⌘ + Enter to submit</span>
                    <Button type="primary" htmlType="submit" loading={submitting} size="large">Report issue</Button>
                  </div>
                </Form>
              </section>
            </>
          )}
        </div>
      </TrackerShell>
    </>
  );
}

TrackerReportPage.nolayout = true;
